import mongoose from 'mongoose';

import Order, { ORDER_STATUSES } from '../models/Order.js';
import { emitOrderCreated, emitOrderUpdated } from '../services/socketService.js';

const getOrderLookupQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return {
      $or: [{ _id: id }, { orderId: id }]
    };
  }

  return { orderId: id };
};

const buildFilters = (query) => {
  const filters = {};

  if (query.status && ORDER_STATUSES.includes(query.status)) {
    filters.status = query.status;
  }

  if (query.phone) {
    filters.customerPhone = { $regex: query.phone, $options: 'i' };
  }

  if (query.startDate || query.endDate) {
    filters.createdAt = {};

    if (query.startDate) {
      filters.createdAt.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      filters.createdAt.$lte = new Date(query.endDate);
    }
  }

  if (query.search) {
    const term = query.search.trim();

    filters.$or = [
      { orderId: { $regex: term, $options: 'i' } },
      { customerName: { $regex: term, $options: 'i' } }
    ];
  }

  return filters;
};

const normalizeItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      name: String(item?.name || '').trim(),
      quantity: Number(item?.quantity) > 0 ? Number(item.quantity) : 1,
      specialInstructions: String(item?.specialInstructions || '').trim(),
      price: Number(item?.price) >= 0 ? Number(item.price) : 0
    }))
    .filter((item) => item.name.length > 0);
};

export const listOrders = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const filters = buildFilters(req.query);

    const [orders, total] = await Promise.all([
      Order.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filters)
    ]);

    return res.status(200).json({
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const createManualOrder = async (req, res, next) => {
  try {
    const items = normalizeItems(req.body.items);

    if (!items.length) {
      return res.status(400).json({ message: 'At least one valid order item is required' });
    }

    const order = await Order.create({
      customerName: String(req.body.customerName || 'Walk-in Customer').trim(),
      customerPhone: String(req.body.customerPhone || 'Unknown').trim(),
      items,
      rawTranscript: String(req.body.rawTranscript || '').trim(),
      status: 'received',
      estimatedTime: Number(req.body.estimatedTime) >= 0 ? Number(req.body.estimatedTime) : 30
    });

    emitOrderCreated(order);

    return res.status(201).json({ order });
  } catch (error) {
    return next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne(getOrderLookupQuery(req.params.id));

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({ order });
  } catch (error) {
    return next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${ORDER_STATUSES.join(', ')}`
      });
    }

    const order = await Order.findOne(getOrderLookupQuery(req.params.id));

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;

    if (Number(req.body.estimatedTime) >= 0) {
      order.estimatedTime = Number(req.body.estimatedTime);
    }

    await order.save();
    emitOrderUpdated(order);

    return res.status(200).json({ order });
  } catch (error) {
    return next(error);
  }
};

export const getOrderStats = async (_req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaysOrders = await Order.find({ createdAt: { $gte: startOfDay } });

    const totalOrdersToday = todaysOrders.length;

    const deliveredOrders = todaysOrders.filter((order) => order.status === 'delivered');
    const averagePrepTimeMinutes =
      deliveredOrders.length > 0
        ? Number(
            (
              deliveredOrders.reduce((sum, order) => {
                const prepTime = (order.updatedAt.getTime() - order.createdAt.getTime()) / 60000;
                return sum + prepTime;
              }, 0) / deliveredOrders.length
            ).toFixed(1)
          )
        : 0;

    const revenueToday = Number(
      todaysOrders
        .reduce((orderTotal, order) => {
          const lineTotal = order.items.reduce(
            (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
            0
          );

          return orderTotal + lineTotal;
        }, 0)
        .toFixed(2)
    );

    const statusCounts = ORDER_STATUSES.reduce((acc, currentStatus) => {
      acc[currentStatus] = todaysOrders.filter((order) => order.status === currentStatus).length;
      return acc;
    }, {});

    return res.status(200).json({
      totalOrdersToday,
      averagePrepTimeMinutes,
      revenueToday,
      statusCounts
    });
  } catch (error) {
    return next(error);
  }
};

export const trackOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId }).select(
      'orderId customerName items status estimatedTime createdAt updatedAt'
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({ order });
  } catch (error) {
    return next(error);
  }
};

import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

export const ORDER_STATUSES = ['received', 'confirmed', 'preparing', 'ready', 'delivered'];

const orderItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    specialInstructions: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      index: true,
      default: () => `ORD-${nanoid(10).toUpperCase()}`
    },
    customerName: {
      type: String,
      trim: true,
      default: 'Guest Caller'
    },
    customerPhone: {
      type: String,
      trim: true,
      default: 'Unknown'
    },
    items: {
      type: [orderItemSchema],
      default: []
    },
    rawTranscript: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'received',
      index: true
    },
    estimatedTime: {
      type: Number,
      min: 0,
      default: 30
    }
  },
  {
    timestamps: true
  }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;

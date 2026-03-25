let ioInstance;

export const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    socket.on('track-order', (orderId) => {
      if (!orderId) {
        return;
      }

      socket.join(`order:${orderId}`);
    });

    socket.on('leave-order', (orderId) => {
      if (!orderId) {
        return;
      }

      socket.leave(`order:${orderId}`);
    });
  });
};

export const emitOrderCreated = (order) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.emit('order:created', order);
  ioInstance.to(`order:${order.orderId}`).emit('order:update', order);
};

export const emitOrderUpdated = (order) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.emit('order:updated', order);
  ioInstance.to(`order:${order.orderId}`).emit('order:update', order);
};

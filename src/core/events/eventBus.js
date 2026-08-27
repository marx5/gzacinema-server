const EventEmitter = require('events');

class AppEventBus extends EventEmitter {}

// Singleton instance của EventBus nội bộ ứng dụng
const eventBus = new AppEventBus();

module.exports = eventBus;

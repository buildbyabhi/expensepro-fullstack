const Subscription = require('../models/Subscription');

exports.getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id }).sort({ nextBillingDate: 1 });
    res.json({ success: true, count: subscriptions.length, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addSubscription = async (req, res) => {
  try {
    const { title, amount, cycle, nextBillingDate } = req.body;
    
    if (!title || !amount || !nextBillingDate) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const subscription = await Subscription.create({
      user: req.user._id,
      title,
      amount,
      cycle: cycle || 'monthly',
      nextBillingDate
    });

    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    
    if (subscription.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    await subscription.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

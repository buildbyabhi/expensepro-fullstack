const express = require('express');
const expressRouter = require('express').Router();
const { getSubscriptions, addSubscription, deleteSubscription } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

expressRouter.route('/')
  .get(protect, getSubscriptions)
  .post(protect, addSubscription);

expressRouter.route('/:id')
  .delete(protect, deleteSubscription);

module.exports = expressRouter;

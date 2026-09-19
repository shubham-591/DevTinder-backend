const express = require("express");
const { authMiddleware } = require("../middlewares/auth");
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payment");
const { memberShipAmount } = require("../utils/constants");
const {validateWebhookSignature} = require('razorpay/dist/utils/razorpay-utils');
const User = require("../models/user");

const router = express.Router();

// router.post("/payment/create", express.json(), authMiddleware, async (req, res) => {
router.post("/payment/create", authMiddleware, async (req, res) => {
    
    try {

        const { name, email } = req.user;
        const { membershipType } = req.body;
        
        const order = await razorpayInstance.orders.create({
            "amount": memberShipAmount[membershipType] * 100, // Basically this denotes the lowest currency of the country. For eg. In india its paisa. So 70000 paisa means Rs.700
            "currency": "INR",
            "receipt": "receipt#1",
            // "partial_payment": false, 
            "notes": {
                name,
                email,
                membershipType  
            }   
        });

        // Save the order in the db
        // console.log(order);
        const payment = new Payment({
            userId: req.user._id,   
            orderId: order.id,
            status: order.status,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            notes: order.notes
        });

        console.log("New Razorpay order ID:", order.id);
        
        const savedPayment = await payment.save();
        console.log("Saving order ID in DB:", savedPayment.orderId);
        
        // Send response to the frontend
        
        // THIS 
        // res.status(201).json({...savedPayment.toJSON()});

        // OR THIS
        // res.status(201).json({savedPayment});

        // OR THIS
        // res.status(201).json(savedPayment, process.env.RAZORPAY_KEY_ID);
        res.status(201).json({
            ...savedPayment.toObject(),
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.log(error);
    }
});

// router.post("/payment/webhook", express.raw({ type: "application/json" }), async (req, res) => {
router.post("/payment/webhook", async (req, res) => {
    try {
        console.log("inside");
        
        const webhookSignature = req.headers['x-razorpay-signature'];
        const isWebhookValid = validateWebhookSignature(
            // req.body, 
            JSON.stringify(req.body),
            webhookSignature, 
            process.env.RAZORPAY_WEBHOOK_SECRET
        );

        console.log("Signature:", webhookSignature);
        console.log("Secret exists:", !!process.env.RAZORPAY_WEBHOOK_SECRET);
        console.log("Body type:", typeof req.body);

        if(!isWebhookValid) {
            return res.status(400).json({message: "Invalid webhook signature"});
        }

        // Update the payment status in the database based on the event type
        // Update the user as premium if the payment is successful

        console.log("Webhook received");
        // console.log(req.body);
        // const body = JSON.parse(req.body.toString());
        // console.log("Parsed Body:", body);
        const paymentDetails = req.body.payload.payment.entity;
        console.log("Order ID received from webhook:", paymentDetails.order_id);

        const payment = await Payment.findOne({ orderId: paymentDetails.order_id });

        if (!payment) {
            console.log(
                "Payment not found for orderId:",
                paymentDetails.order_id
            );

            return res.status(200).json({
                message: "Payment not found, but webhook received"
            });
        }

        payment.status = paymentDetails.status;
        await payment.save();

        const user = await User.findOne({_id: payment.userId});
        user.isPremium = true;
        user.membershipType = payment.notes.membershipType;
        await user.save();

        // if(req.body.event === "payment.captured") {
            
        // }

        // if(req.body.event === "payment.failed") {

        // }

        // we have to return success response to razorpay otherwise it will keep sending the webhook again and again. So we have to return 200 status code to razorpay.
        res.status(200).json({message: "Webhook received successfully"});

    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Internal server error"});
    }
});

router.get("/premium/verify", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if(user.isPremium) {
            return res.json({ isPremium: true });
        }
       
        res.status(200).json({ isPremium: false });

    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Internal server error"});
    }
});

module.exports = router;
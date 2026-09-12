const cron = require("node-cron");
const {subDays, startOfDay, endOfDay} = require("date-fns");
const ConnectionRequest = require("../models/connectionRequest");
const sendEmail = require('./sendEmail');

// This string 0 8 * * * means at every morning 8am this code or job will run
cron.schedule("35 20 * * *", async () => {
    // console.log("Hello from cronjob "+ new Date());
    // Send emails to all people who got requests the previous day(yesterday)
    
    try { 
        const yesterday = subDays(new Date(), 1);
        const yesterdayStart = startOfDay(yesterday);
        const yesterdayEnd = endOfDay(yesterday);

        const pendingRequests = await ConnectionRequest.find({
            status: "interested",
            createdAt: {
                $gte: yesterdayStart,
                $lt: yesterdayEnd
            }
        }).populate("fromUserId toUserId");

        // Basically we have taken set bcz lets say elon got 50 requests, so we dont want to send him 50 emails, we just want to send him 1 email 
        // regarding the requests.
        const listOfEmails = [...new Set(pendingRequests.map(req => req.toUserId.email))];
        console.log(listOfEmails);
        

        for(const email of listOfEmails) {
            // Send Emails
            try {
                const res = await sendEmail.run(
                    "New friend requests pending for " +email,
                    "There are so many friend requests pending, please login to DevTinder and accept or reject the requests"
                );
                console.log(res);
                

            } catch (error) {
                console.log(error);
            }
        }
        
    } catch (error) {
        console.log(error);
        
    }

})
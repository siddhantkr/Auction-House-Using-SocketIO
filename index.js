// Setting up the server for listening
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const Models = require('./models.js');
const axios = require('axios');
const { response } = require('express');
const {temp} = require('./api');
const {GLOBAL_VARIABLE} = require('./config');


const bidsArr = [];
var usersCount = 0;
var duration = 0;
var timer = 0;
const DIGITS_ONLY = /^\d+$/;
const TWO_DECIMAL_FORMAT = /^\d+\.\d{2,2}$/
var currentWinningBidInCents = 0;
var auctionCount = -1;
var auctioneersConnected = 0;
var bidLeader;
var itemToAuction;
var winningBids = [];
let startingTimestamp;




app.get('/', function (req, res) {
    res.sendFile(__dirname + '/bidder.html');
});

// Bidding page
app.get('/bidder', function (req, res) {
    res.sendFile(__dirname + '/bidder.html');
});

// Auction page
app.get('/auction', function (req, res) {
    res.sendFile(__dirname + '/auction.html');
});

io.on('connection', function (socket) {
    usersCount = usersCount + 1;

    // Ensuring there is only one auctioneer
    socket.on('newConnection', function (msg) {
        if (msg === 'auctioneer') {
            auctioneersConnected++;
            socket.auctioneerId = auctioneersConnected;
            socket.userName = msg;
            console.log(socket.auctioneerId);
            socket.emit('multipleAuctioneer', socket.auctioneerId === 1 ? false : true);
        }
    });

    // If the auctioneer disconnects, allow another instance of the auction
    socket.on('disconnect', function (msg) {
        if (socket.userName === 'auctioneer') {
            auctioneersConnected--;
        }
    });

    

    // pushing bids to array and emitting if new bid is higher.
    socket.on('newBid', function (msg) {

        console.log(`Received bid with: ${JSON.stringify(msg)}`);
        var newBid = new Models.Bid(msg.name, msg.amount, msg.timestamp);
        if (isBidValid(newBid)) {
            bidsArr.push(newBid);
            if (isBiggerThanCurrenBid(newBid)) {
                currentWinningBidInCents = convertStrToCents(newBid.amount);
                bidLeader = newBid;
                io.emit('bidLeader', newBid);
            }
        } else {
            console.log('Bid isnt valid');
        }
    });

    // Initializing the conditions of the item for sale
    socket.on('itemToBid', function (msg) {
        console.log(socket.auctioneerId);
        var variable = msg;
        var ans = temp(JSON.stringify(variable));
        
        socket.send(`Price is ${ans}`);
        
        // ensuring each field is filled and there is only one /auction page connected
        if (msg && msg.name && msg.description && msg.startingBid && msg.auctionDuration && socket.auctioneerId === 1) {
            console.log(`Auction started with : ${JSON.stringify(msg)}`);
            itemToAuction = new Models.Item(msg.name, msg.description, msg.startingBid, msg.auctionDuration);
            startingTimestamp = new Date().getTime();
            timer = +itemToAuction.duration;
            if (DIGITS_ONLY.test(timer) && +timer > 0 // making sure the timer > 0
                && (DIGITS_ONLY.test(itemToAuction.startingBid) || TWO_DECIMAL_FORMAT.test(itemToAuction.startingBid))  // checking for valid starting bid
            ) {
                // converts string to bid in cents. 
                currentWinningBidInCents = convertStrToCents(itemToAuction.startingBid);
                io.emit('initAuction', itemToAuction);
                duration = itemToAuction.duration;
                startTimer(itemToAuction.duration);
                // emitting the winning bid when duration of auction finishes
                if (itemToAuction && itemToAuction.itemName) {
                    setTimeout(() => {
                        if (bidLeader && bidLeader.name && bidLeader.amount) {
                            console.log('sending winning results');
                            let winningBid = { 'itemName': itemToAuction.itemName, 'name': bidLeader.name, 'amount': bidLeader.amount };
                            winningBids[auctionCount] = winningBid;
                            // send current winning bid to bidder page
                            io.emit('winningBid', winningBid);
                            // send list of auctioned items to auction page
                            io.emit('winningBids', winningBids);
                        }
                    }, itemToAuction.duration * 1000);
                }
            }
            auctionCount++;
        }
    });

    // Making sure the bid is sent while the acution is active
    function isBidValid(bid) {
        return (
            (DIGITS_ONLY.test(bid.amount) || TWO_DECIMAL_FORMAT.test(bid.amount)) &&
            bid.timestamp > 0 && bid.timestamp > startingTimestamp && bid.timestamp < (startingTimestamp + (duration * 1000)) &&
            bid.name != 'SYSTEM'
        );
    }

    function convertStrToCents(amount) {
        return DIGITS_ONLY.test(amount) ? +amount * 100 : +(amount.replace(/[^0-9]+/g, ''));
    }

    function isBiggerThanCurrenBid(bid) {
        return convertStrToCents(bid.amount) > currentWinningBidInCents;
    }

    function startTimer() {
        io.emit('timer', timer);
    }
});

http.listen(4200, function () {
    // console.log(`Starting server at port: ${process.env.PORT || 4200}`);
    console.log(`Visit http://localhost:${process.env.PORT || 4200}/auction for auction page`);
    console.log(`Visit http://localhost:${process.env.PORT || 4200}/bidder for bidding page`);
});


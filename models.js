
class Bid {
    constructor(name, amount, timestamp) {
        this.name = name;
        this.amount = amount;
        this.timestamp = timestamp;
    }

    toString() {
        const currentTime = new Date().getTime();
        return `{ name: ${this.name} , amount: ${this.amount}, amount_placed: ${currentTime - this.timestamp} seconds ago`;
    }
}

class Item {
    constructor(itemName, description, startingBid, duration) {
        this.itemName = itemName;
        this.description = description;
        this.startingBid = startingBid;
        this.duration = duration;
    }
}

module.exports = {
    Bid: Bid,
    Item: Item
}
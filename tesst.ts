// For my own educational purposes; since,
// I am not good with a lot of classes and stuff.

class Bot {
  fund = 0;
}

class Trip {
  fund = 0;

  constructor(private bot: Bot) {
  }

  getBot() {
    return this.bot;
  }

  newMember() {
    return new Member(this);
  }
}

class Member {
  private bot: Bot;

  constructor(private trip: Trip) {
    this.bot = trip.getBot();
  }

  get tripFund() {
    return this.trip.fund;
  }

  addToFund(money: number) {
    this.trip.fund += money;
  }

  giveToBot(money: number) {
    this.bot.fund += money;
  }
}

const bot = new Bot();
const tour = new Trip(bot);
const member1 = tour.newMember();

// console.log(tour.fund);
member1.addToFund(100);
// console.log(tour.fund);
// console.log(member1.tripFund);

const member2 = tour.newMember();
// console.log(member2.tripFund);
member2.addToFund(200);
// console.log(tour.fund);
// console.log(member1.tripFund);

member1.giveToBot(10);
member2.giveToBot(10);
console.log(bot.fund);

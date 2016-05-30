(function() {
  'use strict';


  var renderGame = function() {
    var $xhr = $.getJSON('http://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6');

    $xhr.done(function(deck) {
      if ($xhr.status !== 200) {
        return;
      }
      if (deck.success !== true) {
        console.log('There was an error in getting the deck');

        return;
      }
      var deckID = deck.deck_id;
      var cardsLeft = deck.remaining;

      console.log(`Deck ID: ${deckID}`);
      console.log(`Cards Remaining: ${cardsLeft}`);

      var player = {
        hand: [],
        money: 500,
        hasBlackjack: false,
        hasAce: false // for unused aces
      };

      var dealer = {
        hand: [], // playing with first card of dealerHand face down
        hasBlackjack: false,
        hasAce: false // for unused aces
      };

      var draw = function() {
        var $cardDrawn = $.getJSON(`http://deckofcardsapi.com/api/deck/${deckID}/draw/?count=2`);

        $cardDrawn.done(function(data) {
          if ($cardDrawn.status !== 200) {
            return;
          }
          if (data.success !== true) {
            draw();

            return;
          }
          console.log(data.cards);
          cardsLeft = data.remaining;
          data.cards[0].name = data.cards[0].value;
          var temp = data.cards[0].name;

          if (temp === 'KING' || temp === 'QUEEN' || temp === 'JACK') {
            data.cards[0].value = 10;

            return data.cards;
          }
          if (temp === 'ACE') {
            data.cards[0].value = 11;

            return data.cards;
          }
          data.cards[0].value = parseInt(temp);

          return data.cards;
        });
        $cardDrawn.fail(function(err) {
          console.log('Error in draw function');
          console.log(err);
        });
      };

      var deal = function() {
        player.hand.push(draw()[0]);
        dealer.push(draw()[0]);
        player.hand.push(draw()[0]);
        dealer.push(draw()[0]);
      };

      var startGame = function() {
        deal();
      };

      startGame();

      var calculateHand = function(person) {
        var total = 0;

        for (card of person.hand) {
          total += card.value;
          if (card.value === 11) { person.hasAce = true; }
        }
        if (total === 21) { person.hasBlackjack = true; }

        return total;
      };

      var changeAce = function(person) {
        for (card of person.hand) {
          if (card.value === 11) {
            card.value = 1;
            person.hasAce = false;

            return; // just in case 2 aces and only want to alter 1
          }
        }
      };

      var endGame = function(winner) {
        //for when game ends
      };

      var displayNewCard = function(person) {
        //for when a new non-starting card is drawn
      };

      var displayGame = function() {
        //for when first game first starts
        //and possibly for placing initial bet
      };

      var displayHands = function() {
        //for when hands are dealt
      };

      var dealerTurn = function() {
        var total = calculateHand(dealer);

        if (total === 21) {
          player.hasBlackjack ? endGame('tie') : endGame('dealer');

          return;
        }
        if (total > 21) {
          if (dealer.hasAce) {
            changeAce(dealer);
            dealerTurn();

            return;
          }
          else {
            endGame('player');

            return;
          }
        }
        if (total <= 16) {
          dealer.hand.push(draw()[0]);
          displayNewCard('dealer');
          dealerTurn();

          return;
        }
        if (total < 21 && total >= 17) {
          var playerTotal = calculateHand(player);

          if (playerTotal > total) {
            endGame('player');

            return;
          }
          if (playerTotal < total) {
            endGame('dealer');

            return;
          }
          endGame('tie');

          return;
        }
      };

      var endPlayerTurn = function(){
        $('#hit').off();
        $('#stand').off();
        dealerTurn();
      };

      // add event listners to buttons and everything
      var playerTurn = function() {
        var total = calculateHand(player)
        if (player.hasBlackjack) {
          console.log("PLAYER HAS BLACKJACK");
          endPlayerTurn();

          return;
        }
        $('#hit').on('click', function(){
          console.log('PLAYER HIT');
          player.hand.push(draw()[0]);
          displayNewCard(player);
          playerTurn();

          return;
        });
        $('#stand').on('click', function(){
          console.log('PLAYER STOOD');
          endPlayerTurn();

          return;
        });
        if (total > 21){
          console.log("PLAYER BUSTED");
          endPlayerTurn();

          return;
        }
      };

      var shuffle = function() {
        var $shuffled = $.getJSON(`http://deckofcardsapi.com/api/deck/${deckID}/shuffle/`);

        $shuffled.done(function(data) {
          if ($shuffled.status !== 200) {
            return;
          }
          if (data.shuffled !== true){
            shuffle();

            return;
          }
          cardsLeft = data.remaining;
          console.log(data.shuffled);
        });
        $shuffled.fail(function(err) {
          console.log('Error in shuffle function');
          console.log(err);
        });
      };

      var shuffleCheck = function() {
        if (cardsLeft <= 60) { shuffle(deckID); }
      };

      var restartGame = function() {
        shuffleCheck();
        player.hand = [];
        dealer.hand = [];
        player.hasAce = false;
        dealer.hasAce = false;
        player.hasBlackjack = false;
        dealer.hasBlackjack = false;
        startGame();
      };
    });
    $xhr.fail(function(err) {
      console.log(err);
    });

  }; // end of renderGame()
})();

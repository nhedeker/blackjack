(function() {
  'use strict';

  $('#start').on('click', function(){
    renderGame();
  });

  var renderGame = function() {
    $('.removable').remove();

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

      $('.navbar-fixed').after('<div id="board" class="center-align"></div');
      var $board = $('#board');

      var displayGame = function() {
        var $row1 = $('<div class="row" id="row-1"></div>');
        $row1.append('<div class="col s2"></div>');
        $row1.append('<div class="col s8 valign-wrapper" id="dealerHand"></div>');
        $row1.append('<div class="col s2"></div>');

        var $row3 = $('<div class="row" id="row-3"></div>');

        $row3.append('<div class="col s2 valign-wrapper" id="blackjack-buttons"><button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="hit">Hit</button><p></p><button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="stand">Stand</button></div>');

        $row3.append('<div class="col s8 valign-wrapper" id="playerHand"></div>');

        $row3.append('<div class="col s2 valign-wrapper" id="state-buttons"><button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="play-again">Play Again</button><p></p><button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="adj-bet">Adjust Bet</button><p></p><button data-target="modal1" id="rules" class="btn-large modal-trigger yellow-text purple darken-2">Rules</button></div>');

        $board.append($row1);
        $board.append($row3);

        $board.append('<div id="modal1" class="modal modal-close modal-fixed-footer grey lighten-4"><div class="modal-content grey-text text-darken-4"><h4 class="center-align">Blackjack Rules</h4><p></p><p>A bunch of text</p></div><div class="modal-footer"><a class=" modal-action modal-close waves-effect waves-green btn-flat">Close</a></div></div>');

        $('.modal-trigger').leanModal();
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
        console.log('restarting game');
        shuffleCheck();
        player.hand = [];
        dealer.hand = [];
        player.hasAce = false;
        dealer.hasAce = false;
        player.hasBlackjack = false;
        dealer.hasBlackjack = false;
        startGame();
      };

      var endGame = function(winner) {
        //for when game ends
        //restartGame();
      };

      var draw = function() {
        var $cardDrawn = $.getJSON(`http://deckofcardsapi.com/api/deck/${deckID}/draw/?count=1`);

        $cardDrawn.done(function(data) {
          if ($cardDrawn.status !== 200) {
            return;
          }
          // if (data.success !== true) {
          //   draw();
          //
          //   return;
          // }
          cardsLeft = data.remaining;
          data.cards[0].name = data.cards[0].value;
          var temp = data.cards[0].name;

          if (temp === 'KING' || temp === 'QUEEN' || temp === 'JACK') {
            data.cards[0].value = 10;
          }
          else if (temp === 'ACE') {
            data.cards[0].value = 11;
          }
          else {
            data.cards[0].value = parseInt(temp);
          }
        });

        $cardDrawn.fail(function(err) {
          console.log('Error in draw function');
          console.log(err);
        });
        return $cardDrawn;
      };

      var deal = function() {
        var $promise = $.when(draw(), draw(), draw(), draw());
        $promise.done(function (data1, data2, data3, data4) {
          player.hand.push(data1[0].cards[0]);
          dealer.hand.push(data2[0].cards[0]);
          player.hand.push(data3[0].cards[0]);
          dealer.hand.push(data4[0].cards[0]);
          displayHands();
        });
      };

      var displayHands = function() {
        $('#dealerHand').empty();
        $('#playerHand').empty();

        for (var card of player.hand){
          var imageURL = card.image;
          var $card = $(`<img src=${imageURL}>`);
          $('#playerHand').append($card);
        }

        //just placeholder until cardback is avalible
        var placeholder = dealer.hand[0].image;
        $('#dealerHand').append(`<img src=${placeholder}>`);

        placeholder = dealer.hand[1].image;
        $('#dealerHand').append(`<img src=${placeholder}>`);
      };

      var displayNewCard = function(person) {
        var imageURL;
        imageURL = person.hand[person.hand.length-1].image;
        var $card = $(`<img src=${imageURL}>`);
        if (person === dealer){
          $('#dealerHand').append($card);
        }
        if (person === player){
          $('#playerHand').append($card);
        }
      };

      var calculateHand = function(person) {
        var total = 0;
        console.log(person);
        console.log(person.hand); //returns empty []
        console.log(person[hand]); //returns hand is not defined
        for (var card of person.hand) {
          console.log('started counting loop');
          total += card.value;
          if (card.value === 11) { person.hasAce = true; }
        }
        if (total === 21) { person.hasBlackjack = true; }
        console.log('finished counting loop');
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

      var dealerTurn = function() {
        var total = calculateHand(dealer);
        console.log(`dealer total: ${total}`);

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

      var playerTurn = function() {
        var total = calculateHand(player)
        console.log(`player total: ${total}`);
        if (player.hasBlackjack) {
          console.log("PLAYER HAS BLACKJACK");
          endPlayerTurn();

          return;
        }
        if (total > 21){
          if (player.hasAce) {
            changeAce(player);
            playerTurn();

            return;
          }
          else {
            console.log("PLAYER BUSTED");
            endPlayerTurn();

            return;
          }
        }
        $('#hit').on('click', function(){
          console.log('PLAYER HIT');
          var $promise2 = $.when(draw());
          $promise2.done(function (data1) {
            console.log(data1);
            player.hand.push(data1.cards[0]);
            displayNewCard(player);
            playerTurn();
            return;
          });
        });
        $('#stand').on('click', function(){
          console.log('PLAYER STOOD');
          endPlayerTurn();

          return;
        });
      };

      var startGame = function() {
        deal();
        playerTurn();
      };

      displayGame();
      startGame();

    });
    $xhr.fail(function(err) {
      console.log(err);
    });
  }; // end of renderGame()
})();

(function() {
  'use strict';

  var renderGame = function() {
    $('.removable').remove();

    var $xhr = $.getJSON('http://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6');

    $xhr.done(function(deck) {
      if ($xhr.status !== 200) {
        return;
      }
      var deckID = deck.deck_id;
      var cardsLeft = deck.remaining;

      var player = {
        hand: [],
        money: 500,
        hasBlackjack: false,
        hasAce: false, // for unused aces
        total: 0
      };

      var dealer = {
        hand: [], // playing with first card of dealerHand face down
        hasBlackjack: false,
        hasAce: false, // for unused aces
        total: 0
      };

      $('.navbar-fixed').after('<div id="board" class="center-align"></div');
      var $board = $('#board');

      var displayGame = function() {
        $('#restart').off();
        var $row1 = $('<div class="row" id="row-1"></div>');

        $row1.append('<div class="col s2 total valign-wrapper"><h4 class="white-text">Dealer Total</h4><h1 class="yellow-text" id="dealer-total"></h1></div>');
        $row1.append('<div class="col s8 valign-wrapper" id="dealerHand"></div>');
        $row1.append('<div class="col s2 valign-wrapper" id="state-buttons"><button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="restart">Play Again</button><p></p><button data-target="modal1" id="rules" class="btn-large modal-trigger yellow-text purple darken-2">Rules</button></div>');

        var $row2 = $('<div class="row" id="row-2"></div>');

        $row2.append('<div class="col s2 valign-wrapper" id="blackjack-buttons"><button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="hit">Hit</button><p></p><button class="btn-large z-depth-1 yellow-text purple darken-2 center-align" id="stand">Stand</button></div>');

        $row2.append('<div class="col s8 valign-wrapper" id="playerHand"></div>');

        $row2.append('<div class="col s2 total valign-wrapper"><h4 class="white-text">Player Total</h4><h1 class="yellow-text" id="player-total"></h1></div>');

        $board.append($row1);
        $board.append($row2);

        $board.append("<div id='modal1' class='modal modal-close grey lighten-4'><div class='modal-content grey-text text-darken-4'><h4 class='center-align'>Blackjack Rules</h4><p></p><p class='left-align'>This game uses a 6 card decks which contains a total of 312 cards. The goal of the game is to get a hand that totals up as close to 21 as possible without going over 21. At the beginning of the game both the dealer and the player are dealt two cards. The dealer's second card is kept hidden from the player until it is the dealer's turn. On the player's turn the player has the choice to draw a new card (hit!) or end their turn with the cards they have. If a player or the dealer hits and their cards total to more than 21 they bust and their turn ends immediately. Kings, queens, and jacks are valued at 10 while aces are valued at 11 unless they cause the hand to bust - then their value changes to 1. If the player or dealer has an exact value of 21 in their hand they got blackjack and their turn automatically ends. To win the game you must not bust and you must have a hand total larger than anyone else left in the game. Enjoy the game!</p></div><div class='modal-footer'><a class='modal-action modal-close waves-effect waves-green btn-flat'>Close</a></div></div>");

        $('.modal-trigger').leanModal();
      };

      var shuffle = function() {
        var $shuffled = $.getJSON(`http://deckofcardsapi.com/api/deck/${deckID}/shuffle/`);

        $shuffled.done(function(data) {
          if ($shuffled.status !== 200) {
            return;
          }
          if (data.shuffled !== true) {
            shuffle();

            return;
          }
          cardsLeft = data.remaining;
        });
        $shuffled.fail(function(err) {
          console.log(err);
        });
      };

      var shuffleCheck = function() {
        if (cardsLeft <= 60) { shuffle(deckID); }
      };

      var endGame = function(winner) {
        if (winner === 'player') {
          Materialize.toast('CONGRATULATIONS, YOU WON!', 6000, 'rounded');
        }
        else if (winner === 'dealer') {
          Materialize.toast('Dealer Won!', 6000, 'rounded');
        }
        else {
          Materialize.toast("Wow, it's a Tie!", 6000, 'rounded');
        }
      };

      var draw = function() {
        var $cardDrawn = $.getJSON(`http://deckofcardsapi.com/api/deck/${deckID}/draw/?count=1`);

        $cardDrawn.done(function(data) {
          if ($cardDrawn.status !== 200) {
            return;
          }
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
          console.log(err);
        });

        return $cardDrawn;
      };

      var displayHands = function() {
        $('#dealerHand').empty();
        $('#playerHand').empty();

        for (var card of player.hand){
          var imageURL = card.image;
          var $card = $(`<img src=${imageURL} class='playingCard'>`);
          $('#playerHand').append($card);
        }

        var placeholder = dealer.hand[0].image;
        $('#dealerHand').append(`<img src=${placeholder} class='playingCard'>`);

        placeholder = dealer.hand[1].image;
        $('#dealerHand').append('<div class="card-back"></div>');
      };

      var displayNewDealerCard = function() {
        var imageURL = dealer.hand[dealer.hand.length-1].image;
        var $card = $(`<img src=${imageURL} class='playingCard'>`);

        $('#dealerHand').append($card);
      };

      var displayNewPlayerCard = function() {
        var imageURL = player.hand[player.hand.length-1].image;
        var $card = $(`<img src=${imageURL} class='playingCard'>`);

        $('#playerHand').append($card);
      };

      var calculateHand = function(person) {
        var total = 0;

        for (var card of person.hand) {
          total += card.value;
          if (card.value === 11) { person.hasAce = true; }
        }
        if (total === 21) { person.hasBlackjack = true; }

        return total;
      };

      var calculateWinner = function() {
        if (player.total > dealer.total) {
          endGame('player');

          return;
        }

        if (dealer.total > player.total) {
          endGame('dealer');

          return;
        }

        endGame('tie');
      };

      var changeAce = function(person) {
        for (var card of person.hand) {
          if (card.value === 11) {
            card.value = 1;
            person.hasAce = false;

            return; // just in case 2 aces and only want to alter 1
          }
        }
      };

      var displayTotal = function(person) {
        if (person === dealer) {
          $('#dealer-total').text(person.total);
        }
        if (person === player) {
          $('#player-total').text(person.total);
        }
      };

      var updateTotal = function(person, amount) {
        person.total = amount;
        displayTotal(person);
      };

      var displayDealerCards = function() {
        $('.card-back').remove();
        var secondCard = dealer.hand[1].image;
        $('#dealerHand').append(`<img src=${secondCard} class='playingCard'>`);
      };

      var dealerHit = function() {
        var $promise = $.when(draw());

        $promise.done(function(data) {
          dealer.hand.push(data.cards[0]);
          displayNewDealerCard();
          dealerTurn();

          return;
        });
      };

      var dealerTurn = function() {
        updateTotal(dealer, calculateHand(dealer));

        if (dealer.total === 21) {
          Materialize.toast('Dealer has Blackjack!', 6000, 'rounded');
          player.hasBlackjack ? endGame('tie') : endGame('dealer');

          return;
        }

        if (dealer.total > 21) {
          if (dealer.hasAce) {
            changeAce(dealer);
            dealerTurn();

            return;
          }
          else {
            Materialize.toast('Dealer Busted', 6000, 'rounded');
            endGame('player');

            return;
          }
        }

        if (dealer.total < 21 && dealer.total >= 17) {
          calculateWinner();

          return;
        }

        if (dealer.total <= 16) {
          dealerHit();

          return;
        }
      };

      var endPlayerTurn = function() {
        $('#hit').off();
        $('#stand').off();
        displayDealerCards();
      };

      var playerHit = function() {
        var $promise = $.when(draw());

        $promise.done(function(data) {
          player.hand.push(data.cards[0]);
          displayNewPlayerCard();
          playerTurn();

          return;
        });
      };

      var playerTurn = function() {
        updateTotal(player, calculateHand(player));
        if (player.hasBlackjack) {
          Materialize.toast('You have Blackjack!', 6000, 'rounded');
          endPlayerTurn();
          dealerTurn();

          return;
        }

        if (player.total > 21) {
          if (player.hasAce) {
            changeAce(player);
            playerTurn();

            return;
          }
          else {
            Materialize.toast('You Busted', 6000, 'rounded');
            endPlayerTurn();
            endGame('dealer');

            return;
          }
        }

        $('#hit').off();
        $('#stand').off();

        $('#hit').on('click', function() {
          playerHit();

          return;
        });

        $('#stand').on('click', function() {
          endPlayerTurn();
          dealerTurn();

          return;
        });
      };

      var deal = function() {
        var $promise = $.when(draw(), draw(), draw(), draw());

        $promise.done(function (data1, data2, data3, data4) {
          player.hand.push(data1[0].cards[0]);
          dealer.hand.push(data2[0].cards[0]);
          player.hand.push(data3[0].cards[0]);
          dealer.hand.push(data4[0].cards[0]);
          displayHands();
          updateTotal(player, calculateHand(player));
          calculateHand(dealer);
          updateTotal(dealer, dealer.hand[0].value);
          playerTurn();
        });
      };

      var startGame = function() {
        $('#restart').on('click', restartGame);
        deal();
      };

      var restartGame = function() {
        shuffleCheck();
        player.hand = [];
        dealer.hand = [];
        player.hasAce = false;
        dealer.hasAce = false;
        player.hasBlackjack = false;
        dealer.hasBlackjack = false;
        $('#toast-container').remove();
        $('#restart').off();
        startGame();
      };

      displayGame();
      startGame();
    });
    $xhr.fail(function(err) {
      console.log(err);
    });
  }; // end of renderGame()

  $('#start').on('click', function() {
    renderGame();
  });
})();

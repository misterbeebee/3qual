function shouldAutorotateToInterfaceOrientation() {
  return "NO";
}

function reOrientDisplayUp() {
  noop();
}

function reOrientDisplayLeft() {
  alert("LandscapeLeft  not supported");
}

function reOrientDisplayRight() {
  alert("LandscapeRight not supported");
}
iPhone.orientChange(reOrientDisplayUp, reOrientDisplayLeft, reOrientDisplayRight);
var DEBUG_RULES_OK = false;
if (DEBUG_RULES_OK) {
  var DEBUG_ALL_SETS_VALID = false;
  var DEBUG_NO_SETS_VALID = false;
  var DEBUG_TEST_DECK = false;
  var DEBUG_KEEP_SORTED_DECK = false;
  var DEBUG_ENABLE_DEVELOPER_CONSOLE = true;
  var DEBUG_MAX_DECK_SIZE = 7;
  var DEBUG_ALL_CARDS_ROWS = 9;
  var DEBUG_ALL_CARDS_COLS = 9;
} else {
  var DEBUG_ALL_SETS_VALID = false;
  var DEBUG_NO_SETS_VALID = false;
  var DEBUG_TEST_DECK = false;
  var DEBUG_KEEP_SORTED_DECK = false;
  var DEBUG_ENABLE_DEVELOPER_CONSOLE = false;
  var DEBUG_MAX_DECK_SIZE = 9999;
  var DEBUG_ALL_CARDS_ROWS = 9;
  var DEBUG_ALL_CARDS_COLS = 9;
}
var RULES_ALLOW_COLORS = true;
var RULES_ALLOW_FILL = true;
var RULES_ALLOW_NEW_CARDS_WHEN_SETS_EXISTS = true;
var QUALE_VALS = 3;
var COLORS = ["blue", "red", "green"];
var COUNTS = [1, 2, 3];
var TOKENS = [
  ["\u25b4", "\u25b5", "\u25ec"],
  ["\u25a0", "\u25a1", "\u25a3"],
  ["\u25cf", "\u25cb", "\u25cd"]
];
var FILLS = [2, 1, 0];
var UIConfig = {
  MATCHED_SET_COLOR: "green",
  CARD_DEAL_DELAY: 150,
  SET_CLEAR_REDEAL_DELAY: 500,
  // Delay before a new card can be touched -- prevents lingering touch from previous card in same spot.
  NEW_CARD_TOUCH_DELAY: 100,
  STANDARD_NOTIFICATION_TIMEOUT: 2000,
  INCORRECT_SELECTION_FLASH_TIME: 500,
  CORRECT_SELECTION_CLEAR_DELAY: 500,
  FLASH_NOTIFICATION_TIMEOUT: 1000,
  VIBRATION_DURATION: 200,
  SHOW_CARD_SIGNATURE: true
};

function CELL_HEIGHT() {
  return 50;
}

function CELL_WIDTH() {
  return 84;
}

function CARD_FACE_HEIGHT() {
  return 46;
}

function CARD_FACE_WIDTH() {
  return 80;
}
var SPRITE_WIDTH = "22";
var SPRITE_HEIGHT = "32";
var SPRITE_WIDTH_PX = SPRITE_WIDTH + "px";
var SPRITE_HEIGHT_PX = SPRITE_HEIGHT + "px";
var theBoard;
var GUI = {};

function togglePages(pageIdArray) {
  $("#" + pageIdArray[0]).hide();
  $("#" + pageIdArray[1]).show();
}

function toggleHelpFromMain() {
  togglePages(["main", "helpText"]);
  $("#exitHelp").focus();
}

function toggleMainFromHelp() {
  togglePages(["helpText", "main"]);
}

function togglePreferencesFromHelp() {
  togglePages(["helpText", "preferences"]);
  flicker("#newGame");
}

function toggleHelpFromPreferences() {
  togglePages(["preferences", "helpText"]);
}

function togglePreferencesFromMain() {
  togglePages(["main", "preferences"]);
  flicker("#newGame");
}

function toggleMainFromPreferences() {
  togglePages(["preferences", "main"]);
}

function togglePreferencesFromStats() {
  togglePages(["stats", "preferences"]);
}

function toggleStatsFromPreferences() {
  togglePages(["preferences", "stats"]);
}

function toggleMainFromStats() {
  togglePages(["stats", "main"]);
}

function toggleStatsFromMain() {
  togglePages(["main", "stats"]);
}

function setNotification(notificationAreaId, msg, notificationId) {
  var target = $("#" + notificationAreaId);
  var targetDiv = target.get(0);
  targetDiv.notificationId = notificationId;
  if (target.html() !== msg) {
    $("#" + notificationAreaId + " .notificationMessage").html(msg);
    target.css("display", "block");
  }
}

function clearNotification(notificationAreaId, notificationId) {
  var target = $("#" + notificationAreaId);
  var targetDiv = target.get(0);
  console.debug("clearing Notification: " + notificationAreaId + "; id: " + notificationId);
  if (targetDiv.notificationId === notificationId) {
    console.debug("Yes, clearing Notification: ID match: " + notificationId + " !== " + targetDiv.notificationId);
    setNotification(notificationAreaId, "&nbsp;", undefined);
    target.css("display", "none");
  } else {
    console.debug("Not clearing Notification: ID mismatch: " + notificationId + " !== " + targetDiv.notificationId);
  }
}

function notifyCore(notificationAreaId, msg, timeout) {
  var notificationId = new Date();
  setNotification(notificationAreaId, msg, notificationId);
  if (notify !== console.log) {}
  if (!defined(timeout)) {
    timeout = UIConfig.STANDARD_NOTIFICATION_TIMEOUT;
  }
  if (defined(timeout) && (timeout > 0)) {
    window.setTimeout(function() {
      clearNotification(notificationAreaId, notificationId);
    }, timeout);
  }
}

function notifyTop(msg, timeout) {
  notifyCore("topNotification", msg, timeout);
}

function notify(msg, timeout) {
  notifyCore("notification", msg, timeout);
}


function cardTouched() {
  this.touched = true;
  Card.clicked(this);
}

function cardClicked() {
  if (!this.touched) {
    Card.clicked(this);
  } else {
    this.touched = false;
  }
}

var Board = {
  standardRows: function() {
    return DEBUG_TEST_DECK ? DEBUG_ALL_CARDS_ROWS : Deck.quales;
  },
  standardCols: function() {
    return DEBUG_TEST_DECK ? DEBUG_ALL_CARDS_COLS : 3;
  },
  maxRows: function() {
    return DEBUG_TEST_DECK ? DEBUG_ALL_CARDS_ROWS : (Deck.quales + 2);
  },
  maxCols: function() {
    return DEBUG_TEST_DECK ? DEBUG_ALL_CARDS_COLS : 3;
  },
  standardCards: function() {
    return Board.standardRows() * Board.standardCols();
  },
  dealMoreCards: function(board) {
    console.log("User requested more cards.");
    if (Board.hasValidSet(board)) {
      Game.incrementIncorrectDealMore();
      if (Rules.onlyDealMoreWhenNecessary()) {
        notify("Cannot add cards now. Find a matching set.");
        return;
      } else {
        Deck.dealCards(Board.emptyCells(board), 3);
      }
    } else {
      Game.incrementCorrectDealMore();
      // Try to deal.
      if (Board.emptyCells(theBoard).length <= 0) {
        console.log("Board is full. Can't deal");
        var validSet = Board.getValidSet(board);
        if (!defined(validSet)) {
          notify("Oops! Need more cards, but there is no room!<br>Click 'End' button.");
          flash("#endGame");
        }
      } else {
        console.log("Board has room. Deal.");
        Deck.dealCards(Board.emptyCells(board), 3);
      }
    }
  },
  getBoard: function(boardId) {
    return $("#" + boardId);
  },
  moveCard: function(from, to) {
    console.debug("Move from " + from.row + ", " + from.col + " to " + to.row + "," + to.col);
    var card = $(from).find(".card").get(0);
    if (card === undefined) {
      console.error("Failed to find card at From location!");
    }
    console.log("Moving card: " + $(card).html());
    Board.removeCard(card);
    card.setAttribute("onBoard", true);
    $(to).append(card);
  },
  clear: function(board) {
    var cardCells = $(board).find(".cardCell");
    cardCells.html("");
  },
  drawBoard: function(board) {
    var tableId = "boardTable";
    var table = document.createElement("table");
    table.id = tableId;
    board.append(table);
    loop(Board.maxRows())(function(ri) {
      var rowId = Board.getRowId(ri);
      var row = document.createElement("tr");
      row.id = rowId;
      $("#" + tableId).append(row);
      loop(Board.maxCols())(function(ci) {
        var cell = document.createElement("td");
        cell.className = "cardTD";
        cell.height = "" + CELL_HEIGHT() + "px";
        $("#" + rowId).append(cell);
        var cellDiv = document.createElement("div");
        var cellId = Board.getCellId(ri, ci);
        cellDiv.row = ri;
        cellDiv.col = ci;
        cellDiv.id = cellId;
        cellDiv.className = "cardCell";
        $(cell).append(cellDiv);
      });
    });
    Board.clear(board);
  },
  getRowId: function(ri) {
    return "boardRow_" + ri;
  },
  getCellId: function(ri, ci) {
    return "boardCell_" + ri + "_" + ci;
  },
  getCell: function(ri, ci) {
    return $("#" + Board.getCellId(ri, ci));
  },
  hasValidSet: function(board) {
    var validSet = Board.getValidSet(board);
    return defined(validSet);
  },
  getValidSet: function(board) {
    var cards = Board.cardsOnTable(board);
    var n = cards.length;
    console.debug("Checking " + n + " cards for valid set.");
    if (n < 3) {
      return;
    }
    for (var i1 = 0; i1 < n; i1++) {
      var c1 = cards[i1];
      for (var i2 = i1+1; i2 < n; i2++) {
        var c2 = cards[i2];
        for (var i3 = i2+1; i3 < n; i3++) {
          var c3 = cards[i3];
          if (Card.isValidSet([c1, c2, c3])) {
            console.log("Valid set: "
              + "Cards: " + "; " + i1 + "," + i2 + "," + i3 + " "
              + "Sigs: " + c1.signature + ", " + c2.signature + ", " + c3.signature);
            return [c1, c2, c3];
          } else {}
        }
      }
    }
    return;
  },
  removeCard: function(card) {
    card.style.position = "absolute";
    card.setAttribute("onBoard", false);
    $(card).fadeOut(Rules.setClearAnimationDelay() / 10);
    var parent = card.parentNode;
    parent.removeChild(card);
    return parent;
  },
  cardsOnTable: function(board) {
    return $("#board .cardCell .card[onBoard=true]");
  },
  emptyCells: function(board) {
    var result = $(board).find(".cardCell:not(:has(.card[onBoard=true]))");
    console.debug("empty cells: " + result.length);
    return result;
  },
  emptyStandardCells: function(board) {
    var result = $.grep($(board).find(".cardCell:not(:has(.card[onBoard=true]))"), Board.isStandardCell);
    console.debug("empty cells: " + result.length);
    return result;
  },
  nonEmptyCells: function(board) {
    var result = $(board).find(".cardCell:has(.card[onBoard=true])");
    console.debug("Non-empty cells: " + result.length);
    return result;
  },
  isEmpty: function(cell) {
    return ($(cell).find(".card[onBoard=true]").length === 0);
  },
  isStandardCell: function(cell) {
    return (cell.row < Board.standardRows()) && (cell.col < Board.standardCols());
  },
  cleanupTable: function(board) {
    console.log("Cleaning up table.");
    var emptyCells = Board.emptyStandardCells(board);
    var nonEmptyNonStandardCells = [];
    map(Board.nonEmptyCells(board))(function(cell) {
      if (!Board.isStandardCell(cell)) {
        console.log("Non-empty non-standard cell.");
        append(nonEmptyNonStandardCells, cell);
      }
    });
    loopDelay(Math.min(emptyCells.length, nonEmptyNonStandardCells.length), Rules.cardDealDelay(), function(i) {
      if (Board.isStandardCell(emptyCells[i]) && i < nonEmptyNonStandardCells.length) {
        console.log("Moving card from non-standard cell.");
        Board.moveCard(nonEmptyNonStandardCells[i], emptyCells[i]);
      }
    });
  }
};
var Card = {
  computeSignature: function(card) {
    var result = "";
    loop(Deck.quales)(function(quale) {
      result += ((card.cardId / Math.pow(QUALE_VALS, quale)) | 0) % QUALE_VALS;
    });
    return result;
  },
  updateStyle: function(card) {
    var newColor;
    if (card.selected) {
      newColor = "yellow";
    } else {
      newColor = "white";
    }
    Card.setColor(card, newColor);
    var faceSelector = "#" + $(card).attr("id");
    $(faceSelector).css("border-color", "#B4B4B4");
  },
  updateStyleForGentleHint: function(card) {
    if (Rules.highlightNewCards()) {
      var faceSelector = "#" + $(card).attr("id");
      $(faceSelector).css("border-color", "black");
    }
  },
  setColor: function(card, color) {
    var faceSelector = "#" + $(card).attr("id") + " .cardFace";
    $(faceSelector).css("backgroundColor", color);
  },
  makeCardFace: function(card) {
    card.faceSpec = [0, 0, 0, 0];
    var faceSpec = card.faceSpec;
    loop(Deck.quales)(function(quale) {
      faceSpec[quale] = ((card.cardId / Math.pow(QUALE_VALS, quale)) | 0) % QUALE_VALS;
      card.faceSpec = faceSpec;
    });
    card.signature = Card.computeSignature(card);
    card.selected = false;
    card.className = "card";
    $(card).css("margin", "0px 0px 0px 0px");
    var cardFace = document.createElement("div");
    cardFace.className = "cardFace";
    var cardLi = document.createElement("li");
    cardLi.className = "nopadding";
    $(cardLi).append(cardFace);
    $(card).append(cardLi);
    var textTokens = false;
    if (textTokens) {
      var token = TOKENS[faceSpec[Deck.TOKEN]][faceSpec[Deck.FILL]];
      var tokens = "";
      loop(COUNTS[faceSpec[Deck.COUNT]])(function(i) {
        tokens += token;
      });
      if (UIConfig.SHOW_CARD_SIGNATURE) {
        tokens += "<br><br/>" + card.signature;
      }
      cardFace.innerHTML = tokens;
      cardFace.style.color = COLORS[faceSpec[Deck.COLOR]];
    } else {
      var addVerticalPadding = function() {
        var padding = document.createElement("div");
        padding.style.minHeight = "" + ((CARD_FACE_HEIGHT() - SPRITE_HEIGHT) / 2) + "px";
        $(cardFace).append(padding);
      };
      addVerticalPadding();
      map(["right", "left"])(function(floatSide) {
        var padding = document.createElement("div");
        var numSpritesOnCard = COUNTS[faceSpec[Deck.COUNT]];
        padding.className = "cardPadding";
        padding.style.cssFloat = floatSide;
        padding.style.minHeight = padding.style.maxHeight = "1px";
        padding.style.minWidth = padding.style.maxWidth = "" + ((CARD_FACE_WIDTH() - SPRITE_WIDTH * numSpritesOnCard) / 2) + "px";
        $(cardFace).append(padding);
      });
      var backgroundPosition = "" + (-SPRITE_WIDTH * (3 * faceSpec[Deck.COLOR] + FILLS[faceSpec[Deck.FILL]])) + "px " + (-SPRITE_HEIGHT * faceSpec[Deck.TOKEN]) + "px";
      var count = COUNTS[faceSpec[Deck.COUNT]];
      loop(count)(function(i) {
        var sprite = document.createElement("div");
        sprite.className = "cardGraphic";
        sprite.style.cssFloat = "left";
        sprite.style.backgroundPosition = backgroundPosition;
        $(cardFace).append(sprite);
      });
      addVerticalPadding();
    }
    Card.updateStyle(card);
  },
  clicked: function(card) {
    if ((defined(card.selected)) && card.selected) {
      Card.deselect(card);
    } else {
      Card.select(card);
    }
    var tableCards = $(".card");
    var selectedCards = [];
    loop(tableCards.length)(function(i) {
      card = tableCards[i];
      if (card.selected) {
        append(selectedCards, card);
      }
    });
    if (selectedCards.length > 3) {
      notify("Too many selected");
      Card.deselectAll(selectedCards);
    }
    if (selectedCards.length === 3) {
      var valid = Card.isValidSet(selectedCards);
      if (valid) {
        Game.processClickedQualine(selectedCards);
      } else {
        Game.processClickedWrongQualine(selectedCards);
      }
      return;
    }
  },
  deselectAll: function(selectedCards) {
    map(selectedCards)(Card.deselect);
  },
  deselect: function(card) {
    Card.setSelected(card, false);
  },
  select: function(card) {
    Card.setSelected(card, true);
  },
  setSelected: function(card, onOrOff) {
    card.selected = onOrOff;
    Card.updateStyle(card);
  },
  isValidSet: function(selectedCards) {
    if (DEBUG_NO_SETS_VALID) {
      console.debug("DEBUG: No Qualines are valid");
      return false;
    }
    if (DEBUG_ALL_SETS_VALID) {
      console.debug("DEBUG: All Qualines are valid");
      return true;
    }
    if (selectedCards.length !== 3) {
      notify("Wrong number of cards selected!");
      return false;
    }
    if ((selectedCards[0] === selectedCards[1]) || (selectedCards[1] === selectedCards[2]) || (selectedCards[2] === selectedCards[0])) {
      return false;
    }
    var numCards = selectedCards.length;
    var qualeValid = [];
    loop(Deck.quales)(function(qualeId) {
      qualeValid[qualeId] = undefined;
      var v = [];
      loop(selectedCards.length)(function(i) {
        v[i] = selectedCards[i].faceSpec[qualeId];
      });
      if ((v[0] === v[1]) && (v[1] === v[2]) && (v[2] === v[0])) {
        qualeValid[qualeId] = "same";
      } else {
        if ((v[0] !== v[1]) && (v[1] !== v[2]) && (v[2] !== v[0])) {
          qualeValid[qualeId] = "diff";
        } else {
          qualeValid[qualeId] = "mixed";
        }
      }
    });
    return all(function(x) {
      return (x === "same" || x === "diff");
    }, qualeValid);
  },
  matchedQuales: function(selectedCards) {
    var numCards = selectedCards.length;
    var qualeValid = [];
    loop(Deck.quales)(function(qualeId) {
      qualeValid[qualeId] = undefined;
      var v = [];
      loop(selectedCards.length)(function(i) {
        v[i] = selectedCards[i].faceSpec[qualeId];
      });
      if ((v[0] === v[1]) && (v[1] === v[2]) && (v[2] === v[0])) {
        qualeValid[qualeId] = "same";
      }
      if ((v[0] !== v[1]) && (v[1] !== v[2]) && (v[2] !== v[0])) {
        qualeValid[qualeId] = "diff";
      }
    });
    return qualeValid;
  }
};
var Rules = {
  colorQualeEnabled: function() {
    var result = RULES_ALLOW_COLORS && $("#useColorQuale").get(0).checked;
    console.debug("Colors enabled: " + result);
    return result;
  },
  fillQualeEnabled: function() {
    var result = RULES_ALLOW_FILL && $("#useFillQuale").get(0).checked;
    console.debug("Fill enabled: " + result);
    return result;
  },
  onlyDealMoreWhenNecessary: function() {
    var result = (!RULES_ALLOW_NEW_CARDS_WHEN_SETS_EXISTS) || $("#onlyDealWhenNecessary").get(0).checked;
    return result;
  },
  cardDealDelay: function() {
    return $("#cardDealDelay").get(0).checked ? UIConfig.CARD_DEAL_DELAY : 0;
  },
  setClearRedealDelay: function() {
    return $("#cardDealDelay").get(0).checked ? UIConfig.SET_CLEAR_REDEAL_DELAY : 0;
  },
  setClearAnimationDelay: function() {
    return $("#cardDealDelay").get(0).checked ? UIConfig.CORRECT_SELECTION_CLEAR_DELAY : 0;
  },
  incorrectSetAnimationDelay: function() {
    return UIConfig.INCORRECT_SELECTION_FLASH_TIME;
  },
  autoEndGame: function() {
    return $("#autoEndGame").get(0).checked;
  },
  highlightNewCards: function() {
    return $("#highlightNewCards").get(0).checked;
  },
  useSeedCode: function() {
    return $("#useSeedCode").get(0).checked;
  }
};

function disableElement(id, disabledVal) {
  console.log("" + id + ".disabled -> " + disabledVal);
  $("#" + id).get(0).disabled = disabledVal;
}

function updateDealMoreButton() {
  if (Deck.isBusy || Board.emptyCells(theBoard).length <= 0) {
    disableElement("dealMore", true);
  } else {
    disableElement("dealMore", false);
  }
}
var Deck = {
  makeBusy: function(busyValue) {
    Deck.isBusy = busyValue;
    disableElement("hint", busyValue);
    updateDealMoreButton();
  },
  updateSetCounter: function() {
    $("#setCounterValue").html(Deck.setsMatched);
    Deck.counterDisplay("#setCounterSparkline", Deck.setsMatched, UIConfig.MATCHED_SET_COLOR);
    $("#setCounterPluralization").html(Deck.setsMatched === 1 ? "&nbsp;" : "s");
  },
  updateDeckCounter: function() {
    if (Deck.cardsLeft() <= 0) {
      Game.makeFinishButton();
    }
    var cardsLeft = Deck.cardsLeft();
    $("#deckCounterValue").html(cardsLeft);
    Deck.counterDisplay("#deckCounterSparkline", cardsLeft / 3, "brown");
  },
  counterDisplay: function(spanSelector, number, color) {
    if (number <= 0) {
      $(spanSelector).html("&nbsp");
      return;
    }
    if (number > 0) {
      var myvalues = [0];
    }
    loop(number)(function() {
      myvalues.push(1);
    });
    if (number > 0) {
      myvalues.push(0);
    }
    $(spanSelector).sparkline(myvalues, {
      type: "bar",
      barColor: color,
      barSpacing: 0,
      barWidth: 2
    });
  },
  cardsLeft: function() {
    return (Deck.deckSize - Deck.deckPlace);
  },
  initDeck: function(qualeVals) {
    Deck.quales = 2;
    var nextDisplayQualeId = 3;
    Deck.dealLock = false;
    Deck.TOKEN = 0;
    Deck.COUNT = 1;
    Deck.COLOR = Rules.colorQualeEnabled() ? Deck.quales++ : (nextDisplayQualeId--);
    Deck.FILL = Rules.fillQualeEnabled() ? Deck.quales++ : (nextDisplayQualeId--);
    console.log("Building deck for " + Deck.quales + " quales with " + qualeVals + " alternatives");
    Deck.deckSize = Math.min(Math.pow(qualeVals, Deck.quales), DEBUG_MAX_DECK_SIZE);
    Deck.deck = [];
    Deck.deckPlace = 0;
    Deck.setsMatched = 0;
    var deck = Deck.deck;
    var deckSize = Deck.deckSize;
    Deck.SORTED_DECK = new Array();
    loop(Deck.deckSize)(function(i) {
      var card = document.createElement("ul");
      card.cardId = i;
      $(card).attr("id", "card" + i);
      Card.makeCardFace(card);
      Deck.SORTED_DECK[i] = card;
    });
    loop(Deck.deckSize)(function(i) {
      Deck.deck[i] = Deck.SORTED_DECK[i];
    });
    Deck.updateSetCounter();
    Deck.updateDeckCounter();
  },
  shuffle: function(deckSpec) {
    if (DEBUG_KEEP_SORTED_DECK) {
      return;
    }
    var positions;
    if (deckSpec) {
      Deck.deckSize = deckSpec.deckSize;
      positions = deckSpec.positions;
      if (deckSize = Math.pow(QUALE_VALS, 4)) {
        $("#useColorQuale").get(0).checked = true;
        $("#useFillQuale").get(0).checked = true;
      } else {
        if (deckSize = Math.pow(QUALE_VALS, 3)) {
          $("#useColorQuale").get(0).checked = true;
          $("#useFillQuale").get(0).checked = false;
        } else {
          if (deckSize = Math.pow(QUALE_VALS, 3)) {
            $("#useColorQuale").get(0).checked = false;
            $("#useFillQuale").get(0).checked = false;
          }
        }
      }
      Deck.initDeck(QUALE_VALS);
    }
    var deck = Deck.deck;
    var deckSize = Deck.deckSize;
    if (positions) {
      loop(deckSize)(function(i) {
        deck[i] = Deck.SORTED_DECK[positions[i]];
      });
    } else {
      loop(deckSize)(function(i) {
        var pos = (deckSize - 1) - ((Math.random() * (deckSize - i)) | 0);
        var tmp = deck[i];
        deck[i] = deck[pos];
        deck[pos] = tmp;
      });
    }
  },
  dealCard: function(cell, canHighlightNewCard) {
    if (!Board.isEmpty(cell)) {
      console.log("Cannot deal card on top of another card!");
      return false;
    }
    if (Deck.cardsLeft() <= 0) {
      console.log("Can't deal card: No more cards to deal! Deck place: " + Deck.deckPlace);
      return false;
    }
    var card = Deck.deck[Deck.deckPlace];
    card.setAttribute("onBoard", true);

    // Wait a moment for previous touch on old card to (maybe) finish,
    // before listening for touch on new card.
    card.removeEventListener("touchstart", cardTouched);
    card.removeEventListener("click", cardClicked);
    window.setTimeout(function() {
      card.addEventListener("touchstart", cardTouched, true);
      card.addEventListener("click", cardClicked, true);
    }, UIConfig.NEW_CARD_TOUCH_DELAY);

    $(cell).append(card);
    if (canHighlightNewCard) {
      Card.updateStyleForGentleHint(card);
    }
    Deck.deckPlace++;
    Deck.updateDeckCounter();
    return true;
  },

  dealCards: function(cells, numCards, callback) {
    console.log("Dealing " + numCards + " into " + cells.length + " cells");
    if (cells.length <= numCards) {
      disableElement("dealMore", true);
    }
    if (Deck.isBusy) {
      notify("Deck is busy; cannot deal cards.");
    }
    Deck.makeBusy(true);
    if (cells.length === 0) {
      console.log("Cannot deal card here.");
      notify("Cannot deal cards now.");
    }
    var chainedCallbacks = chain([function() {
      console.log("Checking if game is over");
      Game.checkEndGame(false);
      console.log("Done checking if game is over");
      Deck.makeBusy(false);
    }, callback]);
    canHighlightNewCard = (numCards <= 3);
    loopDelay(Math.min(cells.length, numCards), Rules.cardDealDelay(), chainedCallbacks)(function(i) {
      if (Deck.dealCard(cells[i], canHighlightNewCard)) {} else {
        console.log("Cannot deal card.");
      }
    });
  },
  dealMissingCards: function() {
    var cardsOnTable = Board.cardsOnTable(theBoard);
    console.log(cardsOnTable.length + " cards on table.");
    var emptyCells = Board.emptyCells(theBoard);
    if (cardsOnTable.length >= Board.standardCards()) {
      Board.cleanupTable(theBoard);
      return;
    }
    var numMissingCards = Board.standardCards() - cardsOnTable.length;
    var cardsToDeal = numMissingCards;
    if (0 >= Deck.cardsLeft()) {
      console.log("Deck empty; will not re-fill board.");
      cardsToDeal = 0;
      return;
    }
    if (numMissingCards > Deck.cardsLeft()) {
      console.log("Deck does not have enough cards to replace missing cards: " + Deck.cardsLeft());
      cardsToDeal = Deck.cardsLeft();
    }
    console.log(emptyCells.length + " empty cells.");
    console.log(numMissingCards + " missing cards to deal.");
    map(cardsOnTable)(Card.updateStyle);
    Deck.dealCards(emptyCells, numMissingCards);
  },
  dealStartCards: function(board, callback) {
    console.log("Deal start cards");
    Deck.dealCards(Board.emptyCells(board), Board.standardCards(), callback());
  }
};
var Seed = {
  seedSep: "",
  base: 36,
  lengthMap: {
    108: 81,
    27: 27,
    6: 8
  },
  toSeed: function(deck) {
    var seed = "";
    var base = Seed.base;
    var size = Deck.deckSize;
    console.log("Generating seed for deck of size " +  Deck.deckSize);
    // If debugging with odd-size deck, drop extra cards.
    loop(Math.floor(size / 3))(function(i) {
      // convert from base "size"
      var triplet = (deck.deck[3 * i + 2].cardId * size 
                   + deck.deck[3 * i + 1].cardId) * size 
                   + deck.deck[3 * i].cardId;
      var segmentSize = Math.ceil(Math.log(Deck.deckSize * Deck.deckSize * Deck.deckSize) / Math.log(base));
      seed += sprintf("%0" + segmentSize + "s", triplet.toString(base));
    });
    return seed;
  },
  fromSeed: function(seed) {
    if (!seed) {
      return null;
    }
    var base = Seed.base;
    var size = Seed.lengthMap[seed.length];
    if (!size) {
      notify("Bad seed; I will ignore it. (Wrong length: " + seed.length + ")");
      return null;
    }
    var segmentSize = Math.ceil(Math.log(size * size * size) / Math.log(base));
    var positions = new Array();
    loop(size / 3)(function(i) {
      var segmentString = seed.substring(i * segmentSize, (i + 1) * segmentSize);
      var segmentNum = parseInt(segmentString, base);
      loop(3)(function(j) {
        var pos = (3 * i) + j;
        positions[pos] = segmentNum % size;
        segmentNum = (segmentNum - positions[pos]) / size;
      });
    });
    if (positions.length < size) {
      notify("Bad seed; I will ignore it. (Too short: " + seed + ")");
      return null;
    }
    if (positions.length < 6) {
      notify("Bad seed; I will ignore it. (Much too short: " + seed + ")");
      return null;
    }
    return {
      deckSize: size,
      positions: positions
    };
  },
};
var Game = {
  isBusy: false,
  makeBusy: function(busyValue) {
    Game.isBusy = busyValue;
    disableElement("endGame", busyValue);
  },
  resetGame: function(board, seed) {
    Game.makeEndGameButton();
    if (Game.isBusy) {
      notify("Game is busy; can't reset now.");
      window.setTimeout(function() {
        Game.resetGame(board, seed);
      }, 500);
    }
    Game.makeBusy(true);
    console.log("Reset game.");
    Board.clear(board);
    Game.makeDealMoreButton();
    Game.resetClock();
    Game.over = false;
    Session.startOvers++;
    Game.hints = 0;
    Game.resetHintCard();
    Game.incorrectFinished = 0;
    Game.incorrectQualines = 0;
    Game.incorrectDealMore = 0;
    Game.correctDealMore = 0;
    Game.correctDone = 0;
    Game.fastestTime = {};
    Game.slowestTime = {};
    Game.solveTimes = {};
    Game.Event = { QUALINE: 0, NO_QUALINE: 1, DONE: 2};
    map([Game.Event.QUALINE, Game.Event.NO_QUALINE, Game.Event.DONE])(function(eventType) {
      Game.slowestTime[eventType] = Infinity;
      Game.fastestTime[eventType] = Infinity;
      Game.solveTimes[eventType] = [];
    });
    Game.updateScoreDisplay(0, 0);
    Deck.initDeck(QUALE_VALS);
    if (Rules.useSeedCode()) {
      $("#seedLabel").html("Paste seed code here <br/>(if you have one):<br/>");
      $("#seedForm").show();
      Deck.makeBusy(true);      
    } else {
      Game.startGame();
    }
  },
  startGame: function() {
    Game.makeBusy(true);
    $("#seedForm").hide();
    var seedItem = $("#seed");
    Game.seed = seedItem.val().replace(/"/g, "").replace(/ /g, "").replace(/\t/g, "");
    Deck.shuffle(Seed.fromSeed(Game.seed));
    $("#stallText").css("display", "none");
    Deck.makeBusy(false);
    Deck.dealStartCards(theBoard, function() {
      Game.finishStartGame();
    });
  },
  finishStartGame: function() {
    Game.startClock();
    Game.makeBusy(false);
  },
  resetHintCard: function() {
    Game.hintCard = 3 * Math.random() | 0;
  },
  resetClock: function() {
    Game.timeSpent = 0;
    Game.startTime = null;
    Game.lastSolutionEventTime = 0;
    console.debug("reset clock: " + Game.startTime);
  },
  startClock: function() {
    Game.startTime = new Date();
    console.debug("Start clock: " + Game.startTime);
  },
  pauseClock: function() {
    if (isNull(Game.startTime)) {
      console.debug("Pause clock that hasn't started yet: " + Game.timeSpent);
    } else {
      Game.pauseTime = new Date();
      Game.timeSpent += (Game.pauseTime - Game.startTime) / 1000;
      Game.startTime = null;
      console.debug("Pause clock: " + Game.timeSpent);
    }
  },
  checkClock: function() {
    var timeSinceLastPause = (defined(Game.startTime) && !isNull(Game.startTime)) ? ((new Date() - Game.startTime) / 1000) : 0;
    var time = Game.timeSpent + timeSinceLastPause;
    console.log("Check clock: timeSpent: " + Game.timeSpent + "; sinceLastPause: " + timeSinceLastPause + "; total time: " + time);
    return time;
  },
  incrementHints: function() {
    Game.hints++;
    Game.updateScoreDisplay();
  },
  incrementIncorrectQualines: function() {
    Game.incorrectQualines++;
    Game.updateScoreDisplay();
  },
  incrementIncorrectFinished: function() {
    Game.incorrectFinished++;
    Game.updateScoreDisplay();
  },
  incrementIncorrectDealMore: function() {
    Game.incorrectDealMore++;
    Game.updateScoreDisplay();
  },
  incrementCorrectDealMore: function() {
    Game.recordSolutionEvent(Game.Event.NO_QUALINE);
    Game.correctDealMore++;
    Game.updateScoreDisplay();
  },
  incrementCorrectDone: function() {
    Game.recordSolutionEvent(Game.Event.DONE);
    Game.correctDone++;
    Game.updateScoreDisplay();
  },
  flashCards: function(cards, color, time, callback) {
    var unifiedCallback = callbackNthTime(cards.length, callback);
    console.log("flashing cards.");
    $(cards).animate({
      backgroundColor: color
    }, time).animate({
      backgroundColor: "white"
    }, time, unifiedCallback);
  },
  processClickedQualine: function(selectedCards) {
    var clearCards = function() {
      map(selectedCards)(Board.removeCard);
      if (Deck.cardsLeft() <= 0) {
        Game.makeFinishButton();
      } else {
        updateDealMoreButton();
      }
      Game.resetHintCard();
      Game.recordMatchedSet();
      window.setTimeout(function() {
        Card.deselectAll(selectedCards);
        Deck.dealMissingCards();
      }, Rules.setClearRedealDelay());
    };
    var time = Rules.setClearAnimationDelay() / 2;
    Game.flashCards(selectedCards, UIConfig.MATCHED_SET_COLOR, time, clearCards);
  },
  processClickedWrongQualine: function(selectedCards) {
    Deck.makeBusy(true);
    var validQuales = Card.matchedQuales(selectedCards);
    if (defined(navigator) && defined(navigator.notification)) {
      navigator.notification.vibrate(UIConfig.VIBRATION_DURATION);
    }
    var resetCards = function() {
      Game.incrementIncorrectQualines();
      console.log("deselecting cards automatically.");
      Card.deselectAll(selectedCards);
      Deck.makeBusy(false);
    };
    var time = Rules.incorrectSetAnimationDelay() / 2;
    Game.flashCards(selectedCards, "red", time, resetCards);
  },
  updateScoreDisplay: function(totalTime, timeSinceLastSolutionEvent) {
    if (defined(totalTime)) {
      $("#performance #totalTimeValue").html(sprintfTime(totalTime));
    }
    if (defined(timeSinceLastSolutionEvent)) {
      $("#performance #lastTimeValue").html(sprintfTime(timeSinceLastSolutionEvent));
    }
    $("#performance #scoreValue").html(Game.score(false));
  },
  recordSolutionEvent: function(eventType) {
    var totalTime = Game.checkClock();
    var solveTime = defined(totalTime) ? (totalTime - Game.lastSolutionEventTime) : undefined;
    Game.lastSolutionEventTime = totalTime;
    append(Game.solveTimes[eventType], solveTime);
    var fastest = Game.fastestTime[eventType];
    var slowest = Game.slowestTime[eventType];
    Game.fastestTime[eventType] = (isNaN(fastest) || isNull(fastest) || (solveTime < fastest)) ? solveTime : fastest;
    Game.slowestTime[eventType] = (isNaN(slowest) || isNull(slowest) || (solveTime > slowest)) ? solveTime : slowest;
    console.log("Total: " + sprintfTime(totalTime)
                + "; Last: " + sprintfTime(solveTime)
                + "; Fastest: " + sprintfTime(Game.fastestTime[eventType])
                + "; Slowest: " + sprintfTime(Game.slowestTime[eventType]));
    Game.updateScoreDisplay(totalTime, solveTime);
  },
  recordMatchedSet: function() {
    Deck.setsMatched++;
    Deck.updateSetCounter();
    Game.recordSolutionEvent(Game.Event.QUALINE);
    Game.checkEndGame(false);
  },
  checkEndGame: function(userClicked) {
    var gameOver;
    if (Deck.cardsLeft() > 0) {
      console.debug("Not end of game: Deck not empty");
      gameOver = false;
    } else {
      if (Board.hasValidSet(theBoard)) {
        console.debug("Not end of game: More qualines to find.");
        gameOver = false;
      } else {
        console.debug("Game is over.");
        gameOver = true;
      }
    }
    if (gameOver) {
      if (userClicked || Rules.autoEndGame() || (Board.nonEmptyCells(theBoard).length === 0)) {
        if (userClicked) {
          // Don't count end of game as DealMore. It messes up timing stats.
          // Game.incrementCorrectDealMore();
        }
        Game.endGame(true);
      }
    } else {
      if (userClicked) {
        notify("Not finished yet!");
        Game.incrementIncorrectFinished();
      }
    }
  },
  score: function(gameCompleted) {
    var secPerMinute = 60;
    var time = Game.checkClock();
    var countPerMinute = function(seconds) {
      return secPerMinute / seconds;
    };
    var sumCountPerMinute = function(array) {
      return sum(map(array)(countPerMinute));
    };
    var qualines = Game.solveTimes[Game.Event.QUALINE].length;
    var noqualines = Game.solveTimes[Game.Event.NO_QUALINE].length;
    var done = Game.solveTimes[Game.Event.DONE].length;
    var qpoints = sumCountPerMinute(Game.solveTimes[Game.Event.QUALINE] || []);
    var noqpoints = sumCountPerMinute(Game.solveTimes[Game.Event.NO_QUALINE] || []);
    var donepoints = sumCountPerMinute(Game.solveTimes[Game.Event.DONE] || []);
    var bonuses = (gameCompleted ? 1 : 0) + (gameCompleted && Game.flawless() ? 1 : 0);
    var penalties = Game.hints + Game.incorrectDealMore + Game.incorrectQualines + Game.incorrectFinished;
    var score = (10 * ((qualines + qpoints) + (noqualines + noqpoints + donepoints) + 10 * bonuses - 5 * penalties)) | 0;
    return score;
  },
  flawless: function() {
    return (Session.startOvers === 0) && (Game.hints === 0) && (Game.incorrectFinished === 0) && (Game.incorrectQualines === 0) && (Game.incorrectDealMore === 0);
  },
  buildStats: function(gameCompleted) {
    var flawless = Game.flawless();
    var statsHeader;
    var header = $("#statsHeader");
    var stats = $("#statsContent");
    if (gameCompleted) {
      if (flawless) {
        statsHeader = "Flawless Completion!";
      } else {
        statsHeader = "Congratulations!";
      }
    } else {
      statsHeader = "Game Ended";
    }
    header.html(statsHeader);
    var br = "<br/>";
    var msg = [];
    append(msg, "Score: " + Game.score(gameCompleted));
    append(msg, "Total time: " + sprintfTime(Game.checkClock()));
    if (Session.startOvers > 0) {
      append(msg, "Start-overs: " + Session.startOvers);
    }
    if (Game.hints > 0) {
      append(msg, "Hints: " + Game.hints);
    }
    var mistakes = [
      ["False Matches", Game.incorrectQualines],
      ["False Finishes", Game.incorrectFinished],
      ["Extra Deals", Game.incorrectDealMore]
    ]
    mistakes.forEach(function(mistake) {
      var label = mistake[0];
      var count = mistake[1];
      if (count > 0) {
        append(msg, "<span class='mistake'>" + label + ": " + count + "</span>");
      }
    })
    var qualine = Game.solveTimes[Game.Event.QUALINE];
    if (qualine.length > 0) {
      append(msg, "Matched sets found: " + qualine.length);
      append(msg, "&nbsp;Average time: " + sprintfTime(average(qualine)));
      append(msg, "&nbsp;Fastest: " + sprintfTime(Game.fastestTime[Game.Event.QUALINE])
             + "&nbsp;&nbsp;&nbsp;&nbsp; Slowest: " + sprintfTime(Game.slowestTime[Game.Event.QUALINE]));
    }
    var no_qualine = Game.solveTimes[Game.Event.NO_QUALINE];
    if (NO_QUALINE.length > 0) {
      append(msg, "Dead-ends found: " + NO_QUALINE.length);
      append(msg, "&nbsp;Fastest: " + sprintfTime(Game.fastestTime[Game.Event.NO_QUALINE])
            + "&nbsp;&nbsp;&nbsp;&nbsp; Slowest: " + sprintfTime(Game.slowestTime[Game.Event.NO_QUALINE]));
    }
    console.log(msg);
    Game.statsString = msg.join("<br/>");
    stats.html(Game.statsString);
    return Game.statsString;
  },
  endGame: function(gameCompleted) {
    console.log("endGame called.");
    var statsString = Game.buildStats(gameCompleted);
    if (Game.over) {
      console.log("Game is already over, can't end.");
      throw ("Invalid Game Over");
    } else {
      Game.over = true;
      Game.pauseClock();
      console.log("Building stats page.");
      if (gameCompleted) {
        Session.resetStartOvers();
      }
      console.log("Showing stats page.");
      var to = "";
      var score = Game.score(gameCompleted);
      var scoreNote = "I got " + score;
      var br = "\r\n";
      Game.emailBody = ((br + br + br + "I just finished a game of 3qual." + br + "Here's what I scored:"
        + br + br + $("#statsHeader").html() + br + statsString + br + br
        + "Use this seed code to play the same deck I did: " + Seed.toSeed(Deck) + br + br
        + "Play 3qual online at http://pascalcula.com/3qual and tell me what you score!" + br + br
        + "Play on Android: https://market.android.com/search?q=pascalcula&so=1&c=apps" + br + br + br + br)
        .replace(/<br\/?>/g, br) // fix newline
        .replace(/<[^>]*>/g, '')  // remove tags
        .replace(/&nbsp;/g, " "));
      Game.emailSubject = "Can you top my 3qual score? " + scoreNote;
      toggleStatsFromMain();
      window.setTimeout(Game.makeShowStatsButton, 500);
    }
  },
  checkEndGameAuto: function() {
    Game.checkEndGame(true);
  },
  dealMoreCards: function() {
    Board.dealMoreCards(theBoard);
  },
  clearDealMoreAndFinishEventListeners: function() {
    $("#dealMore").get(0).removeEventListener("click", Game.checkEndGameAuto, true);
    $("#dealMore").get(0).removeEventListener("click", Game.dealMoreCards, true);
  },
  makeDealMoreButton: function() {
    $("#dealMore").get(0).value = "Deal";
    Game.clearDealMoreAndFinishEventListeners();
    $("#dealMore").get(0).addEventListener("click", Game.dealMoreCards, true);
  },
  makeFinishButton: function() {
    $("#dealMore").get(0).value = "Done!";
    Game.clearDealMoreAndFinishEventListeners();
    $("#dealMore").get(0).addEventListener("click", Game.checkEndGameAuto, true);
  },
  endGameManual: function() {
    Game.endGame(false);
  },
  showStats: function() {
    toggleStatsFromMain();
  },
  clearEndGameAndShowStatsEventListeners: function() {
    $("#endGame").get(0).removeEventListener("click", Game.endGameManual, true);
    $("#endGame").get(0).removeEventListener("click", Game.showStats, true);
  },
  makeEndGameButton: function() {
    Game.clearEndGameAndShowStatsEventListeners();
    $("#endGame").get(0).value = "End";
    $("#endGame").get(0).addEventListener("click", Game.endGameManual, true);
  },
  makeShowStatsButton: function() {
    Game.clearEndGameAndShowStatsEventListeners();
    $("#endGame").get(0).value = "Stats";
    $("#endGame").get(0).addEventListener("click", Game.showStats, true);
  }
};

function flicker(selector) {
      $(selector).animate({
        opacity: 0.25,
      }, 200).animate({
        opacity: 1,
      }, 200).animate({
        opacity: 0.25,
      }, 200).animate({
        opacity: 1,
      }, 200);
}


function showHint(board) {
  Game.incrementHints();
  var validSet = Board.getValidSet(board);
  if (defined(validSet)) {
    $(validSet[(Game.hintCard++) % 3]).effect("shake", {
      direction: "up",
      times: 2,
      distance: "5"
    });
  } else {
    if (Deck.cardsLeft() > 0) {
      flicker("#dealMore");
    }
  }
}
var Platform = {
  deviceReady: function() {
    Platform.getPlatform().deviceReady();
  },
  getPlatform: function() {
    var windowPlugins = "";
    for (key in window.plugins) {
      windowPlugins += key + " ";
    }
    if (window.plugins && window.plugins.webintent) {
      platform = Platform.Android;
    } else {
      platform = Platform.PC;
    }
    return platform;
  },
  Android: {
    name: "Android",
    deviceReady: function() {
      document.removeEventListener("backbutton");
      document.addEventListener("backbutton", Platform.Android.goBack, true);
      $("body").unbind("keydown", Platform.PC.keydownHandler);
      $("body").bind("keydown", Platform.PC.keydownHandler);
    },
    goBack: function() {
      navigator.notification.confirm("Do you want to quit 3qual?", function(choice) {
        switch (choice) {
          case 1:
            navigator.app.exitApp();
            break;
          case 2:
            break;
        }
      }, "Exit 3qual?", "Quit Now,Stay and Play");
    },
    createEmail: function(email) {
      var recipients = [];
      window.plugins.webintent.startActivity({
        "type": "message/rfc822",
        "action": WebIntent.ACTION_SEND,
        "extras": {
          "android.intent.extra.EMAIL": email.recipients,
          "android.intent.extra.SUBJECT": email.subject,
          "android.intent.extra.TEXT": email.body,
        }
      }, function() {
        console.log("Email sent!");
      }, function() {
        console.error("Could not send email. Please email 3qual@pascalcula.com to tell us about this problem.");
      });
    }
  },
  IPhone: {
    deviceReady: function() {
      this.prepareConsole();
      document.addEventListener("touchmove", this.preventElasticBehavior, false);
    },
    createEmail: function(email) {
      alert("Email not supported on this device.");
    },
    preventElasticBehavior: function(e) {
      e.preventDefault();
    },
    prepareConsole: function() {
      try {
        try {
          var dummy = console;
        } catch (err) {
          console = {};
        }
        if (!defined(console.fatal)) {
          console.fatal = function(msg) {
            alert(msg);
          };
        }
        if (!defined(console.log)) {
          console.log = function(message) {};
        }
        if (!defined(console.debug)) {
          console.debug = function(message) {};
        }
        try {
          console.log("Test console.log");
          console.debug("Test console.debug");
        } catch (err2) {
          alert(err2);
          if (DEBUG_ENABLE_DEVELOPER_CONSOLE) {
            console.debug = function(msg) {
              notify(msg, 0);
            };
            console.log = function(msg) {
              notify(msg, 0);
            };
          }
        }
      } catch (err3) {
        alert(err3);
      }
    }
  },
  PC: {
    name: "PC",
    deviceReady: function() {
      $("body").unbind("keydown", Platform.PC.keydownHandler);
      $("body").bind("keydown", Platform.PC.keydownHandler);
    },
    keydownHandler: function(event) {
      switch (event.which) {
        case (37):
          if (confirm("Exit 3qual?")) {
            history.go(-1);
          }
          break;
      }
    },
    createEmail: function(email) {
      var bodyButton = $("#email_body");
      var form = $("#email_score_mailto_form");
      var theUrl = "mailto:?" + encodeURI("Subject=" + email.subject);
      form.attr("action", theUrl);
      var sendButton = $('#email_score_mailto_form input[name="send"]');
      sendButton.detach();
      bodyButton.attr("name", "== A 3qual message for you =");
      bodyButton.attr("value", email.body);
      form.submit();
      sendButton.appendTo(form);
      return false;
    }
  }
};
try {
  console = console;
} catch (err) {}
var Session = {
  startOvers: -1,
  resetStartOvers: function() {
    Session.startOvers = -1;
  }
};

function setOption(id, value) {
  $("#" + id).get(0).checked = value;
}

function setDefaultSettings() {
  setOption("useColorQuale", true);
  setOption("useFillQuale", true);
  setOption("onlyDealWhenNecessary", false);
  setOption("autoEndGame", true);
  setOption("cardDealDelay", true);
  setOption("highlightNewCards", false);
  setOption("useSeedCode", false);
}

function setCompetitionSettings() {
  setOption("useColorQuale", true);
  setOption("useFillQuale", true);
  setOption("onlyDealWhenNecessary", true);
  setOption("autoEndGame", false);
  setOption("cardDealDelay", false);
  setOption("highlightNewCards", false);
  setOption("useSeedCode", false);
}

function setTrainingSettings() {
  setOption("useColorQuale", true);
  setOption("useFillQuale", true);
  setOption("onlyDealWhenNecessary", true);
  setOption("autoEndGame", false);
  setOption("cardDealDelay", true);
  setOption("highlightNewCards", true);
  setOption("useSeedCode", false);
}

function setRecreationalSettings() {
  setOption("useColorQuale", true);
  setOption("useFillQuale", true);
  setOption("onlyDealWhenNecessary", true);
  setOption("autoEndGame", true);
  setOption("cardDealDelay", true);
  setOption("highlightNewCards", false);
  setOption("useSeedCode", false);
}

function setKidsSettings() {
  setOption("useColorQuale", true);
  setOption("useFillQuale", false);
  setOption("onlyDealWhenNecessary", false);
  setOption("autoEndGame", true);
  setOption("cardDealDelay", true);
  setOption("highlightNewCards", false);
  setOption("useSeedCode", false);
}

function setupMainPage() {
  togglePreferencesFromMain(theBoard);
  Board.drawBoard(theBoard);
  Game.makeEndGameButton();
  $("#hint").get(0).addEventListener("click", function() {
    showHint(theBoard);
  }, true);
  $("#help").get(0).addEventListener("click", function() {
    toggleHelpFromMain(theBoard);
  }, true);
  Game.makeDealMoreButton();
  $('#email_score_mailto_form input[name="send"]').click(function() {
    Platform.getPlatform().createEmail({
      "subject": Game.emailSubject,
      "body": Game.emailBody
    });
  });
}

function deviceReady() {
  Platform.deviceReady();
}

function forceDeviceReady() {
  window.setTimeout(deviceReady, 500);
  window.setTimeout(deviceReady, 3000);
  window.setTimeout(deviceReady, 10000);
}

function seedChanged() {
  var seedItem = $("#seed");
  var seed = seedItem.attr("value");
  Game.startGame(seed);
}

function main() {
  Platform.IPhone.prepareConsole();
  document.addEventListener("deviceready", deviceReady, false);
  if (!(typeof navigator.device == "undefined")) {
    forceDeviceReady();
  } else {}
  if (typeof navigator.device == "undefined") {
    if (screen.width > 800) {
      forceDeviceReady();
    } else {
      forceDeviceReady();
    }
  } else {
    forceDeviceReady();
  }
  $("#main").css("display", "block");
  Deck.initDeck(QUALE_VALS);
  theBoard = Board.getBoard("board");
  setupMainPage();
  setDefaultSettings();
}

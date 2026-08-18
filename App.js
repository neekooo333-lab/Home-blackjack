import React, { useState, useEffect, useRef, useMemo } from "react";

import {

  SafeAreaView,

  View,

  Text,

  Pressable,

  StyleSheet,

  PanResponder,

  Animated,

  Alert,

  ScrollView,

  Dimensions,

} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SUITS = ["♠", "♥", "♦", "♣"];

const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

const isRed = card => card.suit === "♥" || card.suit === "♦";

const isBlackJack = card => card.rank === "J" && !isRed(card);

const isRedJack = card => card.rank === "J" && isRed(card);

function makeDeck() {

  const deck = [];

  SUITS.forEach(suit => {

    RANKS.forEach(rank => {

      deck.push({

        suit,

        rank,

        id: `${suit}-${rank}-${Math.random()}`,

      });

    });

  });

  return deck;

}

function shuffle(cards) {

  const result = [...cards];

  for (let i = result.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];

  }

  return result;

}

function Card({ card, back = false, small = false, selected = false }) {

  if (back) {

    return (

      <View style={[styles.card, small && styles.smallCard, styles.cardBack]}>

        <View style={styles.backCircle}>

          <Text style={styles.backSuit}>♠</Text>

        </View>

        <Text style={styles.backHome}>HOME</Text>

      </View>

    );

  }

  return (

    <View style={[styles.card, small && styles.smallCard, selected && styles.selectedCard]}>

      <Text style={[styles.cardRank, isRed(card) && styles.redCard]}>

        {card.rank}

      </Text>

      <Text style={[styles.cardSuit, isRed(card) && styles.redCard]}>

        {card.suit}

      </Text>

      <Text style={[styles.cardCorner, isRed(card) && styles.redCard]}>

        {card.suit}

      </Text>

    </View>

  );

}

function DraggableCard({

  card,

  index,

  selected,

  disabled,

  onPlay,

  onMove,

  onSelect,

}) {

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const [dragging, setDragging] = useState(false);

  const responder = useMemo(

    () =>

      PanResponder.create({

        onStartShouldSetPanResponder: () => !disabled,

        onMoveShouldSetPanResponder: () => !disabled,

        onPanResponderGrant: () => {

          setDragging(true);

        },

        onPanResponderMove: (_, gesture) => {

          pan.setValue({

            x: gesture.dx,

            y: gesture.dy,

          });

        },

        onPanResponderRelease: (_, gesture) => {

          setDragging(false);

          pan.setValue({ x: 0, y: 0 });

          if (disabled) return;

          if (gesture.dy < -65) {

            onPlay(card);

            return;

          }

          if (Math.abs(gesture.dx) > 30) {

            onMove(index, gesture.dx);

            return;

          }

          onSelect(card.id);

        },

      }),

    [card, index, disabled, onPlay, onMove, onSelect]

  );

  return (

    <Animated.View

      {...responder.panHandlers}

      style={[

        styles.dragCard,

        dragging && styles.draggingCard,

        { transform: pan.getTranslateTransform() },

      ]}

    >

      <Card card={card} selected={selected} />

    </Animated.View>

  );

}

function Rule({ title, text }) {

  return (

    <View style={styles.ruleCard}>

      <Text style={styles.ruleTitle}>{title}</Text>

      <Text style={styles.ruleText}>{text}</Text>

    </View>

  );

}

export default function App() {

  const [screen, setScreen] = useState("home");

  const [mode, setMode] = useState("cpu");

  const [playerCount, setPlayerCount] = useState(2);

  const [players, setPlayers] = useState([]);

  const [deck, setDeck] = useState([]);

  const [discard, setDiscard] = useState([]);

  const [turn, setTurn] = useState(0);

  const [direction, setDirection] = useState(1);

  const [twoPenalty, setTwoPenalty] = useState(0);

  const [jackPenalty, setJackPenalty] = useState(0);

  const [chosenSuit, setChosenSuit] = useState(null);

  const [queenCoverTurn, setQueenCoverTurn] = useState(false);

  const [message, setMessage] = useState("");

  const [scores, setScores] = useState([]);

  const [roundOver, setRoundOver] = useState(false);

  const [gameWinner, setGameWinner] = useState(null);

  const [selectedCards, setSelectedCards] = useState([]);

  const [privateTurn, setPrivateTurn] = useState(true);

  const topCard = discard.length

    ? discard[discard.length - 1]

    : null;

  const current = players.length

    ? players[turn]

    : null;

  const humanTurn =

    mode === "cpu"

      ? turn === 0

      : true;

  const canSeeHand =

    mode === "cpu"

      ? true

      : privateTurn;

  const bottomPlayer =

    mode === "cpu"

      ? players[0]

      : current;

  function startGame(selectedMode = mode, selectedCount = playerCount) {

    const count = selectedMode === "cpu" ? 2 : selectedCount;

    let cards = shuffle(makeDeck());

    const newPlayers = [];

    for (let i = 0; i < count; i++) {

      newPlayers.push({

        name:

          selectedMode === "cpu"

            ? i === 0

              ? "You"

              : "CPU"

            : `Player ${i + 1}`,

        hand: cards.splice(0, 7),

      });

    }

    const firstCard = cards.shift();

    setMode(selectedMode);

    setPlayerCount(selectedCount);

    setPlayers(newPlayers);

    setDeck(cards);

    setDiscard([firstCard]);

    setTurn(0);

    setDirection(1);

    setTwoPenalty(0);

    setJackPenalty(0);

    setChosenSuit(null);

    setQueenCoverTurn(false);

    setSelectedCards([]);

    setScores(new Array(count).fill(0));

    setRoundOver(false);

    setGameWinner(null);

    setPrivateTurn(selectedMode === "cpu");

    setMessage(

      `${firstCard.rank}${firstCard.suit} is showing. ${newPlayers[0].name} starts.`

    );

    setScreen("game");

  }

  function leaveGame() {

    Alert.alert(

      "Leave game?",

      "Your current game will be lost.",

      [

        { text: "Cancel", style: "cancel" },

        {

          text: "Yes, go Home",

          style: "destructive",

          onPress: () => {

            setScreen("home");

            setSelectedCards([]);

            setRoundOver(false);

            setPrivateTurn(true);

          },

        },

      ]

    );

  }

  function getNextPlayer(from, playDirection = direction, skip = false) {

    if (!players.length) return 0;

    let next =

      from +

      playDirection *

        (skip ? 2 : 1);

    while (next < 0) next += players.length;

    while (next >= players.length) next -= players.length;

    return next;

  }

  function finishRound(winnerIndex) {

    const newScores = [...scores];

    newScores[winnerIndex] =

      (newScores[winnerIndex] || 0) + 1;

    setScores(newScores);

    const target =

      players.length === 2

        ? 10

        : players.length === 3

        ? 11

        : 12;

    if (newScores[winnerIndex] >= target) {

      setGameWinner(players[winnerIndex].name);

    }

    setRoundOver(true);

    setPrivateTurn(false);

  }

  function canPlaySingle(

    card,

    currentTop = topCard,

    activeTwo = twoPenalty,

    activeJack = jackPenalty,

    suitChoice = chosenSuit,

    freeQueenCover = queenCoverTurn

  ) {

    if (!currentTop) return false;

    if (freeQueenCover) return true;

    if (activeTwo > 0) {

      return card.rank === "2";

    }

    if (activeJack > 0) {

      return card.rank === "J";

    }

    if (suitChoice) {

      return card.rank === "A" || card.suit === suitChoice;

    }

    return (

      card.rank === "A" ||

      card.rank === currentTop.rank ||

      card.suit === currentTop.suit

    );

  }

  function canPlaySequence(cards) {

    if (!cards.length) return false;

    let currentTop = topCard;

    let activeTwo = twoPenalty;

    let activeJack = jackPenalty;

    let suitChoice = chosenSuit;

    let freeQueenCover = queenCoverTurn;

    for (const card of cards) {

      if (

        !canPlaySingle(

          card,

          currentTop,

          activeTwo,

          activeJack,

          suitChoice,

          freeQueenCover

        )

      ) {

        return false;

      }

      if (freeQueenCover) {

        freeQueenCover = false;

      }

      if (activeTwo > 0) {

        if (card.rank !== "2") return false;

        activeTwo = Math.min(activeTwo + 2, 8);

      } else if (activeJack > 0) {

        if (card.rank !== "J") return false;

        if (isRedJack(card)) {

          activeJack = 0;

        } else {

          activeJack += 5;

        }

      } else if (card.rank === "2") {

        activeTwo = 2;

      } else if (isBlackJack(card)) {

        activeJack = 5;

      }

      if (card.rank === "A") {

        suitChoice = null;

      }

      currentTop = card;

    }

    return true;

  }

  function selectCard(id) {

    if (!humanTurn || !canSeeHand) return;

    setSelectedCards(previous =>

      previous.includes(id)

        ? previous.filter(item => item !== id)

        : [...previous, id]

    );

  }

  function moveCard(fromIndex, distance) {

    if (!bottomPlayer || !humanTurn || !canSeeHand) return;

    let toIndex =

      fromIndex +

      (distance > 0 ? 1 : -1);

    toIndex = Math.max(

      0,

      Math.min(

        bottomPlayer.hand.length - 1,

        toIndex

      )

    );

    if (toIndex === fromIndex) return;

    const hand = [...bottomPlayer.hand];

    const moved = hand.splice(fromIndex, 1)[0];

    hand.splice(toIndex, 0, moved);

    const targetIndex = mode === "cpu" ? 0 : turn;

    setPlayers(oldPlayers =>

      oldPlayers.map((player, index) =>

        index === targetIndex

          ? { ...player, hand }

          : player

      )

    );

  }

  function drawCards(amount = 1, cpuAction = false) {

    if (!current) return;

    if (

      !cpuAction &&

      (!humanTurn || !canSeeHand)

    ) {

      return;

    }

    let available = [...deck];

    if (available.length < amount) {

      available = [

        ...available,

        ...shuffle(discard.slice(0, -1)),

      ];

    }

    const cards = available.slice(0, amount);

    setDeck(available.slice(cards.length));

    setPlayers(oldPlayers =>

      oldPlayers.map((player, index) =>

        index === turn

          ? {

              ...player,

              hand: [...player.hand, ...cards],

            }

          : player

      )

    );

    setTwoPenalty(0);

    setJackPenalty(0);

    setChosenSuit(null);

    setSelectedCards([]);

    if (queenCoverTurn) {

      setMessage(

        `${current.name} picked up ${cards.length}. Cover the Queen.`

      );

      return;

    }

    setQueenCoverTurn(false);

    const next = getNextPlayer(turn, direction);

    setTurn(next);

    setMessage(

      `${current.name} picked up ${cards.length}. ${

        players[next]?.name || "Next"

      }'s turn.`

    );

    if (mode === "local") {

      setPrivateTurn(false);

    }

  }

  function playSequence(cards, actorName = null) {

    if (!current || !cards.length) return;

    if (!canPlaySequence(cards)) {

      setMessage("Those cards cannot be played together.");

      return;

    }

    const ids = cards.map(card => card.id);

    const newHand = current.hand.filter(

      card => !ids.includes(card.id)

    );

    const actor = actorName || current.name;

    let newTwo = twoPenalty;

    let newJack = jackPenalty;

    let newDirection = direction;

    let redJackCancelled = false;

    let blackJackPlayed = false;

    let twoPlayed = false;

    let kingPlayed = false;

    let eightPlayed = false;

    let acePlayed = false;

    let queenPlayed = false;

    for (const card of cards) {

      if (card.rank === "2") {

        twoPlayed = true;

        newTwo =

          newTwo > 0

            ? Math.min(newTwo + 2, 8)

            : 2;

      } else if (card.rank === "J") {

        if (newJack > 0 && isRedJack(card)) {

          newJack = 0;

          redJackCancelled = true;

        } else if (isBlackJack(card)) {

          blackJackPlayed = true;

          newJack =

            newJack > 0

              ? newJack + 5

              : 5;

        }

      } else if (card.rank === "K") {

        kingPlayed = true;

        newDirection *= -1;

      } else if (card.rank === "8") {

        eightPlayed = true;

      } else if (card.rank === "A") {

        acePlayed = true;

      } else if (card.rank === "Q") {

        queenPlayed = true;

      }

    }

    setPlayers(oldPlayers =>

      oldPlayers.map((player, index) =>

        index === turn

          ? { ...player, hand: newHand }

          : player

      )

    );

    setDiscard(oldDiscard => [

      ...oldDiscard,

      ...cards,

    ]);

    setSelectedCards([]);

    setTwoPenalty(newTwo);

    setJackPenalty(newJack);

    if (kingPlayed) {

      setDirection(newDirection);

    }

    if (acePlayed) {

      setMessage(

        `${actor} played an Ace — choose a suit.`

      );

      setQueenCoverTurn(false);

      if (actorName === "CPU") {

        const counts = {};

        newHand.forEach(card => {

          counts[card.suit] =

            (counts[card.suit] || 0) + 1;

        });

        const bestSuit = SUITS.reduce(

          (best, suit) => {

            const bestCount = counts[best] || 0;

            const suitCount = counts[suit] || 0;

            return suitCount > bestCount

              ? suit

              : best;

          },

          SUITS[0]

        );

        setTimeout(() => {

          chooseCpuSuit(bestSuit, "CPU");

        }, 700);

      }

      return;

    }

    if (

      queenPlayed &&

      cards[cards.length - 1].rank === "Q"

    ) {

      setQueenCoverTurn(true);

      setTurn(turn);

      setChosenSuit(null);

      setSelectedCards([]);

      setMessage(

        `${actor} played Queen — cover it with anything or a run.`

      );

      return;

    }

    const wasQueenCover = queenCoverTurn;

    setQueenCoverTurn(false);

    if (newHand.length === 0) {

      finishRound(turn);

      return;

    }

    if (redJackCancelled) {

      setMessage(

        `${actor} played Red Jack — Black Jack cancelled!`

      );

    } else if (blackJackPlayed) {

      setMessage(

        `${actor} played Black Jack — next player picks up ${newJack} or plays Jack.`

      );

    } else if (twoPlayed) {

      setMessage(

        `${actor} played 2 — next player picks up ${newTwo} or plays 2.`

      );

    } else if (kingPlayed) {

      setMessage(

        `${actor} played King — direction reversed. ${actor} plays again.`

      );

    } else if (eightPlayed) {

      setMessage(

        `${actor} played 8 — next player is skipped.`

      );

    } else if (wasQueenCover) {

      setMessage(`${actor} covered the Queen.`);

    } else if (cards.length > 1) {

      setMessage(

        `${actor} played a run of ${cards.length} cards.`

      );

    } else {

      setMessage(

        `${actor} played ${cards[0].rank}${cards[0].suit}.`

      );

    }

    /*

     * KING FIX

     *

     * A King reverses the direction AND

     * the player who played the King keeps

     * the turn.

     */

    let next;

    if (kingPlayed) {

      next = turn;

    } else {

      next = getNextPlayer(

        turn,

        direction,

        eightPlayed

      );

    }

    setTurn(next);

    setChosenSuit(null);

    setSelectedCards([]);

    if (mode === "local") {

      setPrivateTurn(false);

    }

  }

  function playCard(card) {

    if (!humanTurn || !canSeeHand) return;

    playSequence([card]);

  }

  function playSelected() {

    if (

      !selectedCards.length ||

      !bottomPlayer ||

      !humanTurn ||

      !canSeeHand

    ) {

      return;

    }

    const cards = selectedCards

      .map(id =>

        bottomPlayer.hand.find(

          card => card.id === id

        )

      )

      .filter(Boolean);

    playSequence(cards);

  }

  function chooseSuit(suit) {

    if (

      !topCard ||

      topCard.rank !== "A" ||

      !humanTurn ||

      !canSeeHand

    ) {

      return;

    }

    setChosenSuit(suit);

    const next = getNextPlayer(

      turn,

      direction

    );

    setTurn(next);

    setQueenCoverTurn(false);

    setSelectedCards([]);

    setMessage(

      `${current.name} chose ${suit}. ${

        players[next]?.name || "Next"

      }'s turn.`

    );

    if (mode === "local") {

      setPrivateTurn(false);

    }

  }

  function chooseCpuSuit(suit, actor = "CPU") {

    setChosenSuit(suit);

    const next = getNextPlayer(

      turn,

      direction

    );

    setTurn(next);

    setQueenCoverTurn(false);

    setSelectedCards([]);

    setMessage(

      `${actor} chose ${suit}. Your turn.`

    );

  }

  function callLastCard() {

    if (

      bottomPlayer &&

      bottomPlayer.hand.length === 2 &&

      humanTurn &&

      canSeeHand

    ) {

      setMessage(

        `${bottomPlayer.name} said "Last card!"`

      );

    }

  }

  function passToNextPlayer() {

    setSelectedCards([]);

    setPrivateTurn(true);

    setMessage(

      `${players[turn]?.name || "Player"}'s turn.`

    );

  }

  useEffect(() => {

    if (

      mode !== "cpu" ||

      screen !== "game" ||

      roundOver ||

      turn !== 1 ||

      !players[1]

    ) {

      return;

    }

    const cpu = players[1];

    const timer = setTimeout(() => {

      if (queenCoverTurn) {

        const legal = cpu.hand.filter(card =>

          canPlaySingle(

            card,

            topCard,

            0,

            0,

            null,

            true

          )

        );

        if (!legal.length) {

          drawCards(1, true);

          return;

        }

        const preferred =

          legal.find(card => card.rank === "8") ||

          legal.find(card => card.rank === "2") ||

          legal.find(card => card.rank === "J") ||

          legal[0];

        playSequence([preferred], "CPU");

        return;

      }

      const legal = cpu.hand.filter(card =>

        canPlaySingle(card)

      );

      if (!legal.length) {

        drawCards(

          twoPenalty ||

            jackPenalty ||

            1,

          true

        );

        return;

      }

      if (jackPenalty > 0) {

        const redJack = legal.find(card =>

          isRedJack(card)

        );

        if (redJack) {

          playSequence([redJack], "CPU");

          return;

        }

        const blackJack = legal.find(card =>

          isBlackJack(card)

        );

        if (blackJack) {

          playSequence([blackJack], "CPU");

          return;

        }

      }

      if (twoPenalty > 0) {

        const two = legal.find(

          card => card.rank === "2"

        );

        if (two) {

          playSequence([two], "CPU");

          return;

        }

      }

      const ace = legal.find(

        card => card.rank === "A"

      );

      if (ace) {

        playSequence([ace], "CPU");

        return;

      }

      const king = legal.find(

        card => card.rank === "K"

      );

      if (king) {

        playSequence([king], "CPU");

        return;

      }

      const special =

        legal.find(card => card.rank === "J") ||

        legal.find(card => card.rank === "8") ||

        legal.find(card => card.rank === "Q");

      if (special) {

        playSequence([special], "CPU");

        return;

      }

      let run = [legal[0]];

      for (let i = 1; i < legal.length; i++) {

        const candidate = legal[i];

        if (

          canPlaySequence([

            ...run,

            candidate,

          ])

        ) {

          run.push(candidate);

        }

      }

      playSequence(run, "CPU");

    }, 1100);

    return () => clearTimeout(timer);

  }, [

    mode,

    screen,

    turn,

    roundOver,

    players,

    topCard,

    twoPenalty,

    jackPenalty,

    chosenSuit,

    queenCoverTurn,

  ]);

  if (screen === "home") {

    return (

      <SafeAreaView style={styles.safe}>

        <ScrollView

          contentContainerStyle={styles.homeScroll}

          showsVerticalScrollIndicator={false}

        >

          <View style={styles.home}>

            <Text style={styles.brandSmall}>

              THE ORIGINAL

            </Text>

            <Text style={styles.brand}>

              HOME

            </Text>

            <Text style={styles.brandGold}>

              BLACKJACK

            </Text>

            <View style={styles.titleLine} />

            <Text style={styles.subtitle}>

              BRITISH BLACKJACK

            </Text>

            <View style={styles.logo}>

              <View style={styles.logoInner}>

                <Text style={styles.logoText}>

                  ♠  ♥  ♦  ♣

                </Text>

              </View>

            </View>

            <Text style={styles.tagline}>

              PLAY YOUR WAY

            </Text>

            <Pressable

              style={({ pressed }) => [

                styles.primary,

                pressed && styles.pressed,

              ]}

              onPress={() => startGame("cpu")}

            >

              <Text style={styles.primaryTop}>

                SINGLE PLAYER

              </Text>

              <Text style={styles.primaryText}>

                PLAY VS CPU

              </Text>

              <Text style={styles.primaryArrow}>

                →

              </Text>

            </Pressable>

            <View style={styles.sectionHeading}>

              <View style={styles.headingLine} />

              <Text style={styles.label}>

                PASS & PLAY

              </Text>

              <View style={styles.headingLine} />

            </View>

            <View style={styles.row}>

              {[2, 3, 4].map(number => (

                <Pressable

                  key={number}

                  onPress={() =>

                    setPlayerCount(number)

                  }

                  style={[

                    styles.option,

                    playerCount === number &&

                      styles.selectedOption,

                  ]}

                >

                  <Text style={styles.optionNumber}>

                    {number}

                  </Text>

                  <Text style={styles.optionLabel}>

                    PLAYERS

                  </Text>

                </Pressable>

              ))}

            </View>

            <Pressable

              style={({ pressed }) => [

                styles.secondary,

                pressed && styles.pressed,

              ]}

              onPress={() =>

                startGame(

                  "local",

                  playerCount

                )

              }

            >

              <Text style={styles.secondaryText}>

                START PASS & PLAY

              </Text>

              <Text style={styles.secondaryArrow}>

                →

              </Text>

            </Pressable>

            <Pressable

              style={({ pressed }) => [

                styles.rulesButton,

                pressed && styles.pressed,

              ]}

              onPress={() => setScreen("rules")}

            >

              <Text style={styles.rulesIcon}>

                📖

              </Text>

              <Text style={styles.rulesButtonText}>

                GAME RULES

              </Text>

              <Text style={styles.rulesArrow}>

                →

              </Text>

            </Pressable>

            <View style={styles.featureCard}>

              <Text style={styles.featureEyebrow}>

                BRITISH BLACKJACK

              </Text>

              <Text style={styles.featureTitle}>

                FAST. SIMPLE. STRATEGIC.

              </Text>

              <Text style={styles.muted}>

                Doubles • Runs • 2s{"\n"}

                Jacks • Queens • Kings{"\n"}

                8s • Aces

              </Text>

            </View>

            <Text style={styles.version}>

              HOME BLACKJACK

            </Text>

          </View>

        </ScrollView>

      </SafeAreaView>

    );

  }

  if (screen === "rules") {

    return (

      <SafeAreaView style={styles.safe}>

        <View style={styles.rulesHeader}>

          <Pressable

            style={styles.rulesHomeButton}

            onPress={() => setScreen("home")}

          >

            <Text style={styles.rulesHomeText}>

              ‹ HOME

            </Text>

          </Pressable>

          <View style={styles.rulesHeaderCentre}>

            <Text style={styles.rulesHeaderSmall}>

              HOME

            </Text>

            <Text style={styles.rulesTitle}>

              RULES

            </Text>

          </View>

          <View style={{ width: 72 }} />

        </View>

        <ScrollView

          contentContainerStyle={styles.rulesPage}

          showsVerticalScrollIndicator={false}

        >

          <View style={styles.rulesIntro}>

            <Text style={styles.rulesIntroIcon}>

              ♠

            </Text>

            <Text style={styles.rulesIntroTitle}>

              HOW TO PLAY

            </Text>

            <Text style={styles.rulesIntroText}>

              Get rid of every card in your hand

              before your opponent.

            </Text>

          </View>

          <Rule

            title="01  THE AIM"

            text="Be the first player to get rid of every card in your hand."

          />

          <Rule

            title="02  THE DEAL"

            text="Seven cards are dealt to every player."

          />

          <Rule

            title="03  PLAYING A CARD"

            text="A card may normally be played when it matches the face-up card by rank or suit."

          />

          <Rule

            title="04  DOUBLES & RUNS"

            text="Select multiple cards and press PLAY SELECTED when the cards form a legal sequence."

          />

          <Rule

            title="05  2"

            text="A 2 makes the next player pick up two cards unless they play another 2. The penalty can build to eight."

          />

          <Rule

            title="06  BLACK JACK"

            text="A Black Jack makes the next player pick up five cards unless they play another Jack. Black Jacks stack by five."

          />

          <Rule

            title="07  RED JACK"

            text="A Red Jack cancels an active Black Jack penalty."

          />

          <Rule

            title="08  QUEEN"

            text="When a player lays a Queen, they keep the turn and must cover the Queen."

          />

          <Rule

            title="09  KING"

            text="A King reverses the direction of play and the player who played the King gets the next turn."

          />

          <Rule

            title="10  8"

            text="An 8 makes the next player miss a turn."

          />

          <Rule

            title="11  ACE"

            text="An Ace lets the player choose the next suit."

          />

          <Rule

            title="12  LAST CARD"

            text={'When you have two cards, say "Last card!"'}

          />

          <Rule

            title="13  WINNING"

            text="The first player to get rid of all their cards wins the round."

          />

          <Text style={styles.rulesFooter}>

            HOME BLACKJACK

          </Text>

        </ScrollView>

      </SafeAreaView>

    );

  }

  if (roundOver) {

    return (

      <SafeAreaView style={styles.safe}>

        <View style={styles.resultScreen}>

          <Text style={styles.trophy}>

            🏆

          </Text>

          <Text style={styles.resultSmall}>

            ROUND COMPLETE

          </Text>

          <Text style={styles.winner}>

            {gameWinner

              ? `${gameWinner} WINS`

              : `${players[turn]?.name} WINS`}

          </Text>

          <View style={styles.resultLine} />

          <Text style={styles.resultRound}>

            {gameWinner

              ? "GAME WINNER"

              : "ROUND WINNER"}

          </Text>

          <View style={styles.scoreBox}>

            {players.map((player, index) => (

              <View

                key={index}

                style={styles.scoreRow}

              >

                <Text style={styles.scoreName}>

                  {player.name}

                </Text>

                <Text style={styles.scoreValue}>

                  {scores[index] || 0}

                </Text>

              </View>

            ))}

          </View>

          <Pressable

            style={styles.primary}

            onPress={() =>

              startGame(

                mode,

                playerCount

              )

            }

          >

            <Text style={styles.primaryText}>

              PLAY AGAIN

            </Text>

          </Pressable>

          <Pressable

            style={styles.secondary}

            onPress={() => setScreen("home")}

          >

            <Text style={styles.secondaryText}>

              BACK TO HOME

            </Text>

          </Pressable>

        </View>

      </SafeAreaView>

    );

  }

  if (mode === "local" && !privateTurn) {

    return (

      <SafeAreaView style={styles.safe}>

        <View style={styles.passScreen}>

          <View style={styles.passLock}>

            <Text style={styles.passLockText}>

              🔒

            </Text>

          </View>

          <Text style={styles.passEyebrow}>

            PASS & PLAY

          </Text>

          <Text style={styles.passTitle}>

            PASS THE PHONE

          </Text>

          <Text style={styles.passText}>

            Pass the phone to

          </Text>

          <Text style={styles.passPlayer}>

            {players[turn]?.name}

          </Text>

          <Text style={styles.passSmall}>

            Make sure nobody else can see their

            cards.

          </Text>

          <Pressable

            style={styles.primary}

            onPress={passToNextPlayer}

          >

            <Text style={styles.primaryText}>

              I'M {players[turn]?.name}

            </Text>

          </Pressable>

          <Pressable

            style={styles.secondary}

            onPress={leaveGame}

          >

            <Text style={styles.secondaryText}>

              HOME

            </Text>

          </Pressable>

        </View>

      </SafeAreaView>

    );

  }

  return (

    <SafeAreaView style={styles.safe}>

      <View style={styles.gameHeader}>

        <Pressable

          style={styles.homeGameButton}

          onPress={leaveGame}

        >

          <Text style={styles.homeGameText}>

            🏠

          </Text>

          <Text style={styles.homeGameLabel}>

            HOME

          </Text>

        </Pressable>

        <View style={styles.gameBrand}>

          <Text style={styles.gameBrandTop}>

            HOME

          </Text>

          <Text style={styles.gameBrandBottom}>

            BLACKJACK

          </Text>

        </View>

        <View style={styles.gameModeBadge}>

          <Text style={styles.gameModeText}>

            {mode === "cpu"

              ? "CPU"

              : `${players.length}P`}

          </Text>

        </View>

      </View>

      <View style={styles.table}>

        <View style={styles.tableTopBar}>

          <View style={styles.tableInfo}>

            <Text style={styles.tableInfoLabel}>

              CARDS

            </Text>

            <Text style={styles.tableInfoValue}>

              {deck.length}

            </Text>

          </View>

          <View style={styles.turnPill}>

            <View

              style={[

                styles.turnDot,

                humanTurn &&

                  styles.turnDotActive,

              ]}

            />

            <Text style={styles.turnText}>

              {mode === "cpu"

                ? humanTurn

                  ? "YOUR TURN"

                  : "CPU TURN"

                : `${current?.name || "PLAYER"}'S TURN`}

            </Text>

          </View>

          <View style={styles.tableInfo}>

            <Text style={styles.tableInfoLabel}>

              DIRECTION

            </Text>

            <Text style={styles.tableInfoValue}>

              {direction === 1 ? "→" : "←"}

            </Text>

          </View>

        </View>

        <View style={styles.opponent}>

          <View style={styles.opponentTitleRow}>

            <View style={styles.opponentLine} />

            <View style={styles.playerBadge}>

              <Text style={styles.playerBadgeText}>

                {mode === "cpu"

                  ? "CPU"

                  : "OPPONENTS"}

              </Text>

            </View>

            <View style={styles.opponentLine} />

          </View>

          {mode === "cpu" && (

            <View style={styles.cpuRow}>

              {players[1]?.hand.map((_, index) => (

                <View

                  key={index}

                  style={{

                    marginLeft:

                      index === 0 ? 0 : -14,

                  }}

                >

                  <Card back small />

                </View>

              ))}

            </View>

          )}

          {mode === "cpu" && (

            <Text style={styles.cpuCount}>

              {players[1]?.hand.length || 0} cards

            </Text>

          )}

          {mode === "local" && (

            <Text style={styles.privateNotice}>

              PRIVATE HANDS

            </Text>

          )}

        </View>

        <View style={styles.center}>

          <View style={styles.messageBox}>

            <Text style={styles.message}>

              {message}

            </Text>

          </View>

          <View style={styles.piles}>

            <View style={styles.pile}>

              <Text style={styles.pileLabel}>

                DRAW

              </Text>

              <View style={styles.pileShadow}>

                <Card back />

              </View>

              <Text style={styles.pileCount}>

                {deck.length} left

              </Text>

            </View>

            <View style={styles.pile}>

              <Text style={styles.pileLabel}>

                PLAY

              </Text>

              <View style={styles.pileShadow}>

                {topCard && (

                  <Card card={topCard} />

                )}

              </View>

              {topCard && (

                <Text style={styles.pileCount}>

                  {topCard.rank}

                  {topCard.suit}

                </Text>

              )}

            </View>

          </View>

          <View style={styles.statusBox}>

            {twoPenalty ? (

              <Text style={styles.warning}>

                ⚠ PICK UP {twoPenalty} OR PLAY 2

              </Text>

            ) : jackPenalty ? (

              <Text style={styles.warning}>

                ⚠ PICK UP {jackPenalty} OR PLAY JACK

              </Text>

            ) : chosenSuit ? (

              <Text style={styles.suitStatus}>

                SUIT CHOSEN: {chosenSuit}

              </Text>

            ) : queenCoverTurn ? (

              <Text style={styles.warning}>

                ♛ QUEEN COVER — PLAY ANYTHING

              </Text>

            ) : null}

          </View>

        </View>

        <View style={styles.handArea}>

          <View style={styles.handHeader}>

            <View style={styles.handHeaderLine} />

            <Text style={styles.yourTurn}>

              {mode === "cpu"

                ? "YOUR HAND"

                : `${current?.name || "PLAYER"}'S HAND`}

            </Text>

            <View style={styles.handHeaderLine} />

          </View>

          {bottomPlayer && (

            <View style={styles.hand}>

              {bottomPlayer.hand.map(

                (card, index) => (

                  <DraggableCard

                    key={card.id}

                    card={card}

                    index={index}

                    selected={selectedCards.includes(

                      card.id

                    )}

                    disabled={

                      !humanTurn ||

                      !canSeeHand

                    }

                    onPlay={playCard}

                    onMove={moveCard}

                    onSelect={selectCard}

                  />

                )

              )}

            </View>

          )}

          {humanTurn &&

            canSeeHand &&

            selectedCards.length > 0 && (

              <Pressable

                style={styles.playSelected}

                onPress={playSelected}

              >

                <Text

                  style={styles.playSelectedText}

                >

                  PLAY SELECTED (

                  {selectedCards.length})

                </Text>

              </Pressable>

            )}

          {humanTurn &&

            canSeeHand &&

            bottomPlayer &&

            bottomPlayer.hand.length === 2 && (

              <Pressable

                style={styles.last}

                onPress={callLastCard}

              >

                <Text style={styles.lastText}>

                  SAY "LAST CARD"

                </Text>

              </Pressable>

            )}

          {topCard &&

            topCard.rank === "A" &&

            humanTurn &&

            canSeeHand &&

            !chosenSuit && (

              <View style={styles.suitPanel}>

                <Text style={styles.suitPanelTitle}>

                  CHOOSE A SUIT

                </Text>

                <View style={styles.suitRow}>

                  {SUITS.map(suit => (

                    <Pressable

                      key={suit}

                      style={[

                        styles.suitButton,

                        suit === "♥" &&

                          styles.heartButton,

                        suit === "♦" &&

                          styles.diamondButton,

                        suit === "♣" &&

                          styles.clubButton,

                        suit === "♠" &&

                          styles.spadeButton,

                      ]}

                      onPress={() =>

                        chooseSuit(suit)

                      }

                    >

                      <Text

                        style={styles.suitButtonText}

                      >

                        {suit}

                      </Text>

                      <Text

                        style={styles.suitButtonLabel}

                      >

                        {suit === "♥"

                          ? "HEARTS"

                          : suit === "♦"

                          ? "DIAMONDS"

                          : suit === "♣"

                          ? "CLUBS"

                          : "SPADES"}

                      </Text>

                    </Pressable>

                  ))}

                </View>

              </View>

            )}

          <Pressable

            style={({ pressed }) => [

              styles.draw,

              pressed && styles.pressed,

              (!humanTurn || !canSeeHand) &&

                styles.disabledButton,

            ]}

            onPress={() =>

              humanTurn &&

              canSeeHand &&

              drawCards(

                queenCoverTurn

                  ? 1

                  : twoPenalty ||

                    jackPenalty ||

                    1

              )

            }

          >

            <Text style={styles.drawIcon}>

              +

            </Text>

            <Text style={styles.drawText}>

              {queenCoverTurn

                ? "PICK UP 1"

                : twoPenalty

                ? `PICK UP ${twoPenalty}`

                : jackPenalty

                ? `PICK UP ${jackPenalty}`

                : "PICK UP 1"}

            </Text>

          </Pressable>

          <Text style={styles.dragHint}>

            TAP TO SELECT • SWIPE UP TO PLAY •

            SWIPE SIDEWAYS TO MOVE

          </Text>

        </View>

      </View>

    </SafeAreaView>

  );

}

const styles = StyleSheet.create({

  safe: {

    flex: 1,

    backgroundColor: "#03170F",

  },

  homeScroll: {

    flexGrow: 1,

  },

  home: {

    flex: 1,

    minHeight: 850,

    paddingHorizontal: 22,

    paddingTop: 35,

    paddingBottom: 35,

    alignItems: "center",

    backgroundColor: "#03170F",

  },

  brandSmall: {

    color: "#81988B",

    fontSize: 10,

    fontWeight: "900",

    letterSpacing: 4,

    marginBottom: 8,

  },

  brand: {

    color: "#F8F3E8",

    fontSize: 47,

    fontWeight: "900",

    letterSpacing: 7,

    textAlign: "center",

  },

  brandGold: {

    color: "#D8B866",

    fontSize: 39,

    fontWeight: "900",

    letterSpacing: 2,

    textAlign: "center",

  },

  titleLine: {

    width: 100,

    height: 2,

    backgroundColor: "#C9A45B",

    marginTop: 13,

  },

  subtitle: {

    color: "#B5C5BB",

    textAlign: "center",

    fontSize: 13,

    fontWeight: "900",

    letterSpacing: 4,

    marginTop: 13,

  },

  logo: {

    width: 190,

    height: 115,

    borderRadius: 65,

    borderWidth: 2,

    borderColor: "#C9A45B",

    backgroundColor: "#0A492D",

    alignItems: "center",

    justifyContent: "center",

    marginTop: 24,

    shadowColor: "#000",

    shadowOpacity: 0.35,

    shadowRadius: 10,

    elevation: 8,

  },

  logoInner: {

    width: 170,

    height: 95,

    borderRadius: 55,

    borderWidth: 1,

    borderColor: "#3A7956",

    alignItems: "center",

    justifyContent: "center",

  },

  logoText: {

    color: "#F8F3E8",

    fontSize: 27,

    letterSpacing: 3,

  },

  tagline: {

    color: "#738C7D",

    fontSize: 10,

    fontWeight: "900",

    letterSpacing: 4,

    marginTop: 16,

  },

  primary: {

    width: "100%",

    minHeight: 66,

    backgroundColor: "#C9A45B",

    borderRadius: 15,

    borderWidth: 1,

    borderColor: "#F2D991",

    alignItems: "center",

    justifyContent: "center",

    marginTop: 20,

    shadowColor: "#000",

    shadowOpacity: 0.25,

    shadowRadius: 8,

    elevation: 6,

  },

  primaryTop: {

    color: "#4E3B1B",

    fontSize: 8,

    fontWeight: "900",

    letterSpacing: 2,

    marginBottom: 2,

  },

  primaryText: {

    color: "#151109",

    fontWeight: "900",

    fontSize: 17,

  },

  primaryArrow: {

    position: "absolute",

    right: 20,

    color: "#4C3A19",

    fontSize: 24,

    fontWeight: "900",

  },

  pressed: {

    opacity: 0.72,

    transform: [{ scale: 0.985 }],

  },

  sectionHeading: {

    width: "100%",

    flexDirection: "row",

    alignItems: "center",

    marginTop: 25,

    marginBottom: 7,

  },

  headingLine: {

    flex: 1,

    height: 1,

    backgroundColor: "#234936",

  },

  label: {

    color: "#E6EEE9",

    fontWeight: "900",

    fontSize: 11,

    letterSpacing: 2,

    marginHorizontal: 12,

  },

  row: {

    width: "100%",

    flexDirection: "row",

    justifyContent: "space-between",

  },

  option: {

    width: "31.5%",

    minHeight: 64,

    backgroundColor: "#0C3322",

    borderRadius: 13,

    borderWidth: 1,

    borderColor: "#355B47",

    alignItems: "center",

    justifyContent: "center",

  },

  selectedOption: {

    backgroundColor: "#755A2E",

    borderColor: "#D6B56A",

  },

  optionNumber: {

    color: "#F5F0E5",

    fontSize: 22,

    fontWeight: "900",

  },

  optionLabel: {

    color: "#AFC0B6",

    fontSize: 7,

    fontWeight: "900",

    letterSpacing: 1,

    marginTop: 2,

  },

  secondary: {

    width: "100%",

    minHeight: 58,

    backgroundColor: "#0D3524",

    borderRadius: 14,

    borderWidth: 1,

    borderColor: "#446C56",

    alignItems: "center",

    justifyContent: "center",

    marginTop: 10,

  },

  secondaryText: {

    color: "#F1F4EF",

    fontWeight: "900",

    fontSize: 14,

  },

  secondaryArrow: {

    position: "absolute",

    right: 20,

    color: "#D6B56A",

    fontSize: 22,

    fontWeight: "900",

  },

  rulesButton: {

    width: "100%",

    minHeight: 58,

    backgroundColor: "#061F15",

    borderRadius: 14,

    borderWidth: 1,

    borderColor: "#C9A45B",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    marginTop: 11,

  },

  rulesIcon: {

    fontSize: 18,

    marginRight: 8,

  },

  rulesButtonText: {

    color: "#D6B56A",

    fontSize: 14,

    fontWeight: "900",

    letterSpacing: 1,

  },

  rulesArrow: {

    position: "absolute",

    right: 20,

    color: "#D6B56A",

    fontSize: 22,

    fontWeight: "900",

  },

  featureCard: {

    width: "100%",

    backgroundColor: "#061F15",

    borderRadius: 18,

    borderWidth: 1,

    borderColor: "#244A38",

    paddingVertical: 20,

    paddingHorizontal: 15,

    marginTop: 22,

    alignItems: "center",

  },

  featureEyebrow: {

    color: "#D6B56A",

    fontSize: 10,

    fontWeight: "900",

    letterSpacing: 2,

  },

  featureTitle: {

    color: "#F1E7CE",

    fontSize: 14,

    fontWeight: "900",

    marginTop: 7,

    letterSpacing: 1,

  },

  muted: {

    color: "#A9BCB0",

    lineHeight: 22,

    textAlign: "center",

    fontSize: 13,

    marginTop: 9,

  },

  version: {

    color: "#365744",

    fontSize: 8,

    fontWeight: "900",

    letterSpacing: 3,

    marginTop: 20,

  },

  rulesHeader: {

    height: 70,

    paddingHorizontal: 14,

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    backgroundColor: "#061F15",

    borderBottomWidth: 1,

    borderColor: "#284936",

  },

  rulesHomeButton: {

    width: 72,

  },

  rulesHomeText: {

    color: "#D6B56A",

    fontWeight: "900",

    fontSize: 12,

  },

  rulesHeaderCentre: {

    alignItems: "center",

  },

  rulesHeaderSmall: {

    color: "#EDE9DE",

    fontSize: 8,

    fontWeight: "900",

    letterSpacing: 3,

  },

  rulesTitle: {

    color: "#D6B56A",

    fontSize: 20,

    fontWeight: "900",

    letterSpacing: 2,

  },

  rulesPage: {

    padding: 15,

    paddingBottom: 45,

  },

  rulesIntro: {

    backgroundColor: "#0A492D",

    borderRadius: 18,

    borderWidth: 1,

    borderColor: "#B99651",

    alignItems: "center",

    padding: 20,

    marginBottom: 14,

  },

  rulesIntroIcon: {

    color: "#D6B56A",

    fontSize: 32,

  },

  rulesIntroTitle: {

    color: "#F5F0E5",

    fontSize: 18,

    fontWeight: "900",

    letterSpacing: 2,

    marginTop: 5,

  },

  rulesIntroText: {

    color: "#B9C9BF",

    fontSize: 13,

    textAlign: "center",

    marginTop: 7,

    lineHeight: 20,

  },

  ruleCard: {

    backgroundColor: "#082519",

    padding: 16,

    borderRadius: 14,

    marginBottom: 9,

    borderWidth: 1,

    borderColor: "#214634",

  },

  ruleTitle: {

    color: "#D6B56A",

    fontSize: 13,

    fontWeight: "900",

    letterSpacing: 1,

    marginBottom: 6,

  },

  ruleText: {

    color: "#D2DED6",

    lineHeight: 21,

    fontSize: 13,

  },

  rulesFooter: {

    color: "#D6B56A",

    textAlign: "center",

    fontWeight: "900",

    marginTop: 12,

    letterSpacing: 3,

    fontSize: 10,

  },

  gameHeader: {

    height: 67,

    paddingHorizontal: 10,

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    backgroundColor: "#061F15",

    borderBottomWidth: 1,

    borderColor: "#294936",

  },

  homeGameButton: {

    minWidth: 66,

    height: 43,

    paddingHorizontal: 8,

    borderRadius: 11,

    backgroundColor: "#0D3524",

    borderWidth: 1,

    borderColor: "#C6A35B",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

  },

  homeGameText: {

    fontSize: 13,

  },

  homeGameLabel: {

    color: "#D6B56A",

    fontSize: 9,

    fontWeight: "900",

    marginLeft: 4,

  },

  gameBrand: {

    alignItems: "center",

  },

  gameBrandTop: {

    color: "#F6F2E8",

    fontSize: 11,

    fontWeight: "900",

    letterSpacing: 3,

  },

  gameBrandBottom: {

    color: "#D6B56A",

    fontSize: 13,

    fontWeight: "900",

    letterSpacing: 1,

  },

  gameModeBadge: {

    minWidth: 55,

    height: 34,

    borderRadius: 17,

    backgroundColor: "#0D3524",

    borderWidth: 1,

    borderColor: "#385F4B",

    alignItems: "center",

    justifyContent: "center",

  },

  gameModeText: {

    color: "#D6B56A",

    fontSize: 10,

    fontWeight: "900",

  },

  table: {

    flex: 1,

    backgroundColor: "#07512F",

    margin: 5,

    borderRadius: 24,

    borderWidth: 2,

    borderColor: "#218153",

    overflow: "hidden",

  },

  tableTopBar: {

    minHeight: 42,

    backgroundColor: "#064527",

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    paddingHorizontal: 10,

    borderBottomWidth: 1,

    borderColor: "#1D6C45",

  },

  tableInfo: {

    width: 58,

    alignItems: "center",

  },

  tableInfoLabel: {

    color: "#7FA491",

    fontSize: 6,

    fontWeight: "900",

    letterSpacing: 1,

  },

  tableInfoValue: {

    color: "#E1D39F",

    fontSize: 11,

    fontWeight: "900",

    marginTop: 1,

  },

  turnPill: {

    backgroundColor: "#082A1B",

    borderRadius: 16,

    borderWidth: 1,

    borderColor: "#9B7A3D",

    paddingHorizontal: 12,

    paddingVertical: 6,

    flexDirection: "row",

    alignItems: "center",

  },

  turnDot: {

    width: 6,

    height: 6,

    borderRadius: 4,

    backgroundColor: "#53675C",

    marginRight: 6,

  },

  turnDotActive: {

    backgroundColor: "#D6B56A",

  },

  turnText: {

    color: "#F0E8D4",

    fontSize: 8,

    fontWeight: "900",

    letterSpacing: 1,

  },

  opponent: {

    minHeight: 93,

    paddingTop: 8,

    alignItems: "center",

  },

  opponentTitleRow: {

    width: "75%",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

  },

  opponentLine: {

    flex: 1,

    height: 1,

    backgroundColor: "#2A7650",

  },

  playerBadge: {

    backgroundColor: "#08291A",

    paddingHorizontal: 13,

    paddingVertical: 5,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: "#B99651",

    marginHorizontal: 8,

  },

  playerBadgeText: {

    color: "#F5F0E5",

    fontWeight: "900",

    fontSize: 9,

    letterSpacing: 1,

  },

  cpuRow: {

    flexDirection: "row",

    marginTop: 7,

    justifyContent: "center",

    alignItems: "center",

  },

  cpuCount: {

    color: "#7FA491",

    fontSize: 7,

    fontWeight: "900",

    marginTop: 4,

    letterSpacing: 1,

  },

  privateNotice: {

    color: "#D8BD78",

    marginTop: 12,

    fontSize: 9,

    fontWeight: "900",

    letterSpacing: 1,

  },

  center: {

    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    paddingBottom: 4,

  },

  messageBox: {

    minHeight: 37,

    justifyContent: "center",

    paddingHorizontal: 16,

  },

  message: {

    color: "#F5F2E9",

    fontSize: 14,

    fontWeight: "900",

    textAlign: "center",

    lineHeight: 20,

  },

  piles: {

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    marginTop: 4,

  },

  pile: {

    alignItems: "center",

    marginHorizontal: 15,

  },

  pileLabel: {

    color: "#B8CABE",

    fontSize: 9,

    fontWeight: "900",

    marginBottom: 5,

    letterSpacing: 2,

  },

  pileShadow: {

    shadowColor: "#000",

    shadowOpacity: 0.4,

    shadowRadius: 7,

    elevation: 8,

  },

  pileCount: {

    color: "#729786",

    fontSize: 7,

    fontWeight: "900",

    marginTop: 4,

  },

  statusBox: {

    minHeight: 22,

    justifyContent: "center",

    marginTop: 4,

    paddingHorizontal: 10,

  },

  warning: {

    color: "#F2D687",

    fontSize: 10,

    fontWeight: "900",

    textAlign: "center",

  },

  suitStatus: {

    color: "#C8E1D3",

    fontSize: 10,

    fontWeight: "900",

    textAlign: "center",

  },

  card: {

    width: 49,

    height: 76,

    backgroundColor: "#FBF8EE",

    borderRadius: 9,

    borderWidth: 1,

    borderColor: "#D4C9AD",

    padding: 5,

    justifyContent: "space-between",

    shadowColor: "#000",

    shadowOpacity: 0.42,

    shadowRadius: 5,

    elevation: 6,

  },

  smallCard: {

    width: 34,

    height: 49,

    borderRadius: 7,

    padding: 3,

  },

  cardBack: {

    backgroundColor: "#123D2A",

    borderColor: "#C9A45B",

    alignItems: "center",

    justifyContent: "center",

  },

  backCircle: {

    width: 25,

    height: 25,

    borderRadius: 14,

    borderWidth: 1,

    borderColor: "#A98749",

    alignItems: "center",

    justifyContent: "center",

  },

  backSuit: {

    color: "#D8BD78",

    fontSize: 15,

    fontWeight: "900",

  },

  backHome: {

    color: "#D8BD78",

    fontSize: 5,

    fontWeight: "900",

    letterSpacing: 1,

  },

  cardRank: {

    color: "#151515",

    fontSize: 16,

    fontWeight: "900",

  },

  cardSuit: {

    color: "#151515",

    fontSize: 23,

    textAlign: "center",

  },

  cardCorner: {

    color: "#151515",

    fontSize: 10,

    textAlign: "right",

  },

  redCard: {

    color: "#B72F2F",

  },

  dragCard: {

    width: 49,

    height: 76,

    marginHorizontal: 1,

  },

  draggingCard: {

    zIndex: 100,

  },

  selectedCard: {

    borderWidth: 3,

    borderColor: "#E2C671",

    transform: [{ translateY: -8 }],

  },

  handArea: {

    backgroundColor: "#041D13",

    paddingHorizontal: 7,

    paddingTop: 7,

    paddingBottom: 8,

    borderTopWidth: 1,

    borderColor: "#496957",

    minHeight: 218,

  },

  handHeader: {

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 5,

  },

  handHeaderLine: {

    flex: 1,

    maxWidth: 55,

    height: 1,

    backgroundColor: "#315240",

  },

  yourTurn: {

    color: "#F0E5C8",

    fontWeight: "900",

    textAlign: "center",

    marginHorizontal: 10,

    fontSize: 11,

    letterSpacing: 2,

  },

  hand: {

    flexDirection: "row",

    flexWrap: "wrap",

    justifyContent: "center",

    alignItems: "flex-end",

    minHeight: 78,

  },

  playSelected: {

    backgroundColor: "#C9A45B",

    paddingVertical: 9,

    borderRadius: 10,

    alignItems: "center",

    marginTop: 3,

    borderWidth: 1,

    borderColor: "#F1D990",

  },

  playSelectedText: {

    color: "#171209",

    fontSize: 12,

    fontWeight: "900",

  },

  last: {

    backgroundColor: "#765C31",

    paddingVertical: 8,

    borderRadius: 9,

    alignItems: "center",

    marginTop: 4,

  },

  lastText: {

    color: "#FFF",

    fontSize: 10,

    fontWeight: "900",

    letterSpacing: 1,

  },

  suitPanel: {

    backgroundColor: "#082B1C",

    borderRadius: 12,

    borderWidth: 1,

    borderColor: "#41634F",

    padding: 7,

    marginTop: 4,

  },

  suitPanelTitle: {

    color: "#D7C27E",

    fontSize: 8,

    fontWeight: "900",

    textAlign: "center",

    letterSpacing: 2,

    marginBottom: 5,

  },

  suitRow: {

    flexDirection: "row",

    justifyContent: "center",

  },

  suitButton: {

    width: Math.min(68, (SCREEN_WIDTH - 80) / 4),

    height: 56,

    borderRadius: 11,

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 2,

    marginHorizontal: 3,

  },

  heartButton: {

    backgroundColor: "#A92C35",

    borderColor: "#F18B91",

  },

  diamondButton: {

    backgroundColor: "#B83A40",

    borderColor: "#F19A9F",

  },

  clubButton: {

    backgroundColor: "#193A54",

    borderColor: "#78A8D2",

  },

  spadeButton: {

    backgroundColor: "#101F30",

    borderColor: "#809AB2",

  },

  suitButtonText: {

    color: "#FFF",

    fontSize: 25,

    fontWeight: "900",

  },

  suitButtonLabel: {

    color: "#FFF",

    fontSize: 6,

    fontWeight: "900",

  },

  draw: {

    backgroundColor: "#0E3826",

    borderWidth: 1,

    borderColor: "#63816F",

    minHeight: 39,

    borderRadius: 10,

    alignItems: "center",

    justifyContent: "center",

    marginTop: 5,

    flexDirection: "row",

  },

  drawIcon: {

    color: "#D6B56A",

    fontSize: 19,

    marginRight: 7,

  },

  drawText: {

    color: "#F5F0E5",

    fontSize: 12,

    fontWeight: "900",

  },

  disabledButton: {

    opacity: 0.45,

  },

  dragHint: {

    color: "#527665",

    fontSize: 6,

    fontWeight: "900",

    textAlign: "center",

    marginTop: 5,

  },

  passScreen: {

    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    padding: 24,

    backgroundColor: "#03170F",

  },

  passLock: {

    width: 90,

    height: 90,

    borderRadius: 45,

    backgroundColor: "#0A492D",

    borderWidth: 2,

    borderColor: "#C9A45B",

    alignItems: "center",

    justifyContent: "center",

  },

  passLockText: {

    fontSize: 38,

  },

  passEyebrow: {

    color: "#D6B56A",

    fontSize: 10,

    fontWeight: "900",

    letterSpacing: 3,

    marginTop: 25,

  },

  passTitle: {

    color: "#F5F0E5",

    fontSize: 30,

    fontWeight: "900",

    textAlign: "center",

    marginTop: 7,

  },

  passText: {

    color: "#A9BDB1",

    fontSize: 16,

    marginTop: 25,

  },

  passPlayer: {

    color: "#D6B56A",

    fontSize: 30,

    fontWeight: "900",

    marginTop: 4,

  },

  passSmall: {

    color: "#81988B",

    fontSize: 12,

    textAlign: "center",

    marginTop: 10,

    lineHeight: 18,

    maxWidth: 280,

  },

  resultScreen: {

    flex: 1,

    backgroundColor: "#03170F",

    alignItems: "center",

    justifyContent: "center",

    padding: 22,

  },

  trophy: {

    fontSize: 66,

  },

  resultSmall: {

    color: "#81988B",

    fontSize: 10,

    fontWeight: "900",

    letterSpacing: 3,

    marginTop: 14,

  },

  winner: {

    color: "#F5F0E5",

    fontSize: 30,

    fontWeight: "900",

    textAlign: "center",

    marginTop: 8,

  },

  resultLine: {

    width: 80,

    height: 2,

    backgroundColor: "#C9A45B",

    marginTop: 17,

  },

  resultRound: {

    color: "#D6B56A",

    fontSize: 9,

    fontWeight: "900",

    letterSpacing: 2,

    marginTop: 12,

  },

  scoreBox: {

    width: "100%",

    backgroundColor: "#071F15",

    padding: 8,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: "#294936",

    marginTop: 20,

  },

  scoreRow: {

    minHeight: 48,

    paddingHorizontal: 15,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    borderBottomWidth: 1,

    borderBottomColor: "#183927",

  },

  scoreName: {

    color: "#D4DFD7",

    fontSize: 15,

    fontWeight: "800",

  },

  scoreValue: {

    color: "#D6B56A",

    fontSize: 21,

    fontWeight: "900",

  },

});
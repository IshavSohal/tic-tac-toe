// Assume there are equal number of rows and columns
const Gameboard = function () {
    const rows = 3;
    const columns = 3;
    const board = [];

    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < columns; j++) {
            row.push(null);
        }
        board.push(row);
    }
    const placeToken = (row, col, token) => {
        // Cannot replace one token with another. This is considered an invalid move
        if (board[row][col] === null) {
            board[row][col] = token;
            return 0;
        } else {
            console.error("This cell already has a token! Try again");
            return -1;
        }
    };
    const getBoard = () => board;

    const resetBoard = () => {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
                board[i][j] = null;
            }
        }
    };

    // Check if there is a winner, based on the current state of the board
    const checkWin = function () {
        // Check every row
        for (let i = 0; i < rows; i++) {
            if (board[i].every((cell) => cell === "X")) {
                return "X";
            }

            if (board[i].every((cell) => cell === "O")) {
                return "O";
            }
        }

        // Check each column
        for (let j = 0; j < columns; j++) {
            let col = board.map((row) => row[j]);
            if (col.every((cell) => cell === "X")) {
                return "X";
            }

            if (col.every((cell) => cell === "O")) {
                return "O";
            }
        }
        // Check left-right diagonal
        if (
            board.reduce((total, value, index) => {
                return total && value[index] === "X";
            }, true)
        ) {
            return "X";
        }

        if (
            board.reduce((total, value, index) => {
                return total && value[index] === "O";
            }, true)
        ) {
            return "O";
        }

        // Check right-left diagonal
        if (
            board.reduce((total, value, index) => {
                return total && value[columns - 1 - index] === "X";
            }, true)
        ) {
            return "X";
        }

        if (
            board.reduce((total, value, index) => {
                return total && value[columns - 1 - index] === "O";
            }, true)
        ) {
            return "O";
        }

        // If board is full, then it is a tie
        if (board.every((row) => row.every((cell) => cell !== null))) {
            return "Tied";
        }
        return "Continue";
    };
    return { getBoard, placeToken, checkWin, resetBoard };
};

const Player = function (token, name) {
    let wins = 0;
    const getWins = () => wins;
    const setWins = () => wins++;
    return { token, name, getWins, setWins };
};

const Game = function (player1, player2) {
    let turn = 0;
    let players = [Player("X", player1), Player("O", player2)];
    let board = Gameboard();
    let draws = 0;

    const makeMove = (row, col) => {
        const res = board.placeToken(row, col, players[turn].token);
        // Only proceed if the move was valid
        if (res === 0) {
            turn = Math.abs(turn - 1); // will always be 0 or 1
            const gameState = board.checkWin();

            // If gameState is Continue, we do nothing, and proceed to
            // the next players turn
            if (gameState !== "Continue") {
                if (gameState !== "Tied") {
                    const winner = gameState === "X" ? 0 : 1;
                    players[winner].setWins();
                    return 1;
                } else {
                    draws++;
                    return 2;
                }
            }
        }
        printGameState();
        return 0;
    };

    const printGameState = () => {
        console.log(`It is ${players[turn].name}'s turn (${players[turn].token})`);
        console.log(board.getBoard());
    };

    const resetGameState = () => {
        board.resetBoard();
        turn = 0;
    };

    const getPlayerTurn = () => {
        return players[turn];
    };

    const getScores = () => {
        return { X: players[0].getWins(), O: players[1].getWins(), draws };
    };

    return {
        makeMove,
        printGameState,
        getBoard: board.getBoard,
        getPlayerTurn,
        resetGameState,
        getScores,
    };
};

const DisplayController = (function () {
    let game;
    const introDiv = document.querySelector("#intro");
    const gameDiv = document.querySelector("#game");
    const cells = document.querySelectorAll(".cell");
    const playerTurnDiv = document.querySelector("#playerTurn");
    const startButton = document.querySelector("#start");
    const restartButton = document.querySelector("#restart");
    const player1Input = document.querySelector("#player1");
    const player2Input = document.querySelector("#player2");
    const errorMsg = document.querySelector("#error");
    const scoreTable = document.querySelector("#score-table");
    const player1TableHeader = document.querySelector("#player1-name");
    const player2TableHeader = document.querySelector("#player2-name");
    const player1TableWins = document.querySelector("#player1-wins");
    const player2TableWins = document.querySelector("#player2-wins");
    const tableDraws = document.querySelector("#draws");

    // Called when game is first loaded in. Once the names of the two users are provided,
    // the intro section will be removed, and the game section will be rendered in
    const initializeScreen = () => {
        gameDiv.style.display = "none";

        startButton.addEventListener("click", () => {
            if (player1Input.value && player2Input.value) {
                gameDiv.style.display = "";
                introDiv.style.display = "none";
                errorMsg.textContent = "";
                scoreTable.style.display = "none";
                game = Game(player1Input.value, player2Input.value);
                initializeGameBoard();
                player1TableHeader.textContent = `${player1Input.value}'s wins`;
                player2TableHeader.textContent = `${player2Input.value}'s wins`;
                player1TableWins.textContent = 0;
                player2TableWins.textContent = 0;
                tableDraws.textContent = 0;
                game.printGameState();
            } else {
                errorMsg.textContent = "Please enter a name for each player";
            }
        });
    };

    // Called to reset the state of the game. The board gets cleared, the turn goes back
    // to the player with the X token.
    const resetGame = () => {
        game.resetGameState();
        updateScreen();
        for (let i = 0; i < cells.length; i++) {
            cells[i].disabled = false;
        }
        scoreTable.style.display = "none";
    };
    // Called when the game section is first loaded in. This creates event listeners for each
    // cell that makes a move for the current player.
    const initializeGameBoard = () => {
        for (let i = 0; i < cells.length; i++) {
            cells[i].addEventListener("click", () => {
                cellClickHandler(i);
            });
        }
        updateScreen();
    };

    // Called when a player wins, or a tie occurs.
    const gameOver = (result) => {
        // Prevent buttons from being clicked
        for (let i = 0; i < cells.length; i++) {
            cells[i].disabled = true;
        }

        if (result === 1) {
            playerTurnDiv.textContent = `The winner is: ${game.getPlayerTurn().name}. Congrats!`;
        } else {
            playerTurnDiv.textContent = "The game has ended in a draw :(";
        }
        // Update table
        const scores = game.getScores();
        player1TableWins.textContent = scores["X"];
        player2TableWins.textContent = scores["O"];
        tableDraws.textContent = scores["draws"];
        scoreTable.style.display = "";
    };

    // Called when the board state has updated, and the board in the DOM needs to reflect this
    // change
    const updateScreen = () => {
        const board = game.getBoard();
        const currPlayer = game.getPlayerTurn();
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                cells[i * 3 + j].textContent = board[i][j];
                cells[i * 3 + j].style.color = board[i][j] === "X" ? "green" : "khaki";
            }
        }
        playerTurnDiv.textContent = `It is ${currPlayer.name}'s turn (${currPlayer.token})`;
    };

    const cellClickHandler = (index) => {
        const res = game.makeMove(Math.floor(index / 3), index % 3);
        updateScreen();
        if (res) gameOver(res);
    };

    restartButton.addEventListener("click", () => {
        resetGame();
    });

    initializeScreen();
})();

//TODO: add a heuristic function for AI to use to choose a move
// Will need to carefully assess the state of the gameboard
// If the opposing player has a two in a row combo that they are capable of
// completing to win, the top priority should be to block that. If not, then the
// main priority should be creating a combo of its own. The most disruptive locations for
// the opposing player (corners, center of board) should be prioritized. These locations
// have the highest potential for creating a combo

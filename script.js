document.addEventListener('DOMContentLoaded', () => {
    // Prevent default touch events to avoid scrolling
    document.body.addEventListener('touchmove', (event) => {
        event.preventDefault(); // Prevent scroll on touch
    }, { passive: false }); // Set passive to false to allow preventDefault

    let board = null;
    const game = new Chess();
    const moveHistory = document.getElementById('move-history');
    let moveCount = 1;
    let userColor = 'w';
    
    // Stockfish Web Worker (Single-threaded version)
    const stockfish = new Worker('stockfish-16.1-single.js');

    // Function to highlight squares
    const highlightBestMove = (bestMove) => {
    // Clear previous highlights with fade-out effect
    document.querySelectorAll('.highlight-square').forEach(square => {
        square.classList.add('highlight-square-fade'); // Start fade-out transition
        setTimeout(() => square.classList.remove('highlight-square', 'highlight-square-fade'), 1500); // Remove classes after transition
    });

    const from = bestMove.slice(0, 2);
    const to = bestMove.slice(2, 4);

    // Highlight the new squares
    document.querySelector(`[data-square='${from}']`).classList.add('highlight-square');
    document.querySelector(`[data-square='${to}']`).classList.add('highlight-square');
};

    // Function to request the best move from Stockfish
    const getBestMove = () => {
        stockfish.postMessage('position fen ' + game.fen());
        stockfish.postMessage('go depth 15');
    };

    // Listen for Stockfish's response
    stockfish.onmessage = function (event) {
        const message = event.data;

        // Parse the best move
        if (message.startsWith('bestmove')) {
            const bestMove = message.split(' ')[1];
            highlightBestMove(bestMove); // Highlight the best move
        }
    };

    // Function to handle the start of a drag
    const onDragStart = (source, piece) => {
        if (game.game_over()) return false;

        // Prevent black from moving during white's turn and vice versa
        if (game.turn() === 'w' && piece.search(/^b/) !== -1) return false;
        if (game.turn() === 'b' && piece.search(/^w/) !== -1) return false;

        return true;
    };

    // Function to handle a piece drop
    const onDrop = (source, target) => {
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q',
        });

        if (move === null) return 'snapback';

        recordMove(move.san, moveCount);
        moveCount++;

        // Get best move after white's turn
        if (game.turn() === 'w') {
            getBestMove();
        }
    };

    // Function to handle when the piece snap animation finishes
    const onSnapEnd = () => {
        board.position(game.fen());
    };

    // Function to record and display a move in the move history
    const recordMove = (move, count) => {
        const formattedMove = count % 2 === 1 ? `${Math.ceil(count / 2)}. ${move}` : `${move} -`;
        moveHistory.textContent += formattedMove + ' ';
        moveHistory.scrollTop = moveHistory.scrollHeight;
    };

    // Configuration options for the chessboard
    const boardConfig = {
        showNotation: true,
        draggable: true,
        position: 'start',
        onDragStart,
        onDrop,
        onSnapEnd,
        moveSpeed: 'fast',
        snapBackSpeed: 500,
        snapSpeed: 100,
    };

    // Initialize the chessboard
    board = Chessboard('board', boardConfig);

    // Event listener for the "Play Again" button
    document.querySelector('.play-again').addEventListener('click', () => {
        game.reset();
        board.start();
        moveHistory.textContent = '';
        moveCount = 1;
        clearHighlights();
    });

    // Event listener for the "Set Position" button
    document.querySelector('.set-pos').addEventListener('click', () => {
        const fen = prompt('Enter the FEN notation for the desired position!');
        if (fen !== null && game.load(fen)) {
            board.position(fen);
            moveHistory.textContent = '';
            moveCount = 1;
            clearHighlights();
        } else {
            alert('Invalid FEN notation. Please try again.');
        }
    });

    document.querySelector('.flip-board').addEventListener('click', () => {
        board.flip();
        userColor = userColor === 'w' ? 'b' : 'w';
    });
});

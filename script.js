// ゲームの基本設定
let gameState = {
    score: 0,
    lives: 3,
    stage: 1,
    timer: 30,
    maxTimer: 30,
    isGameRunning: false,
    currentQuestionIndex: 0,
    hintsUsed: {
        freeze: 0,
        fifty: 0,
        skip: 0
    }
};

// ヒントの残り回数
let hintsRemaining = {
    freeze: 3,
    fifty: 3,
    skip: 2
};

// タイマー関連
let timerInterval = null;
let isTimerFrozen = false;

// ★変更点1: クイズデータはJSONから読み込むため、初期化を空にするか、一時的なものに
let loadedQuizData = {}; // JSONから読み込んだクイズデータ全体を保持
let currentQuestions = []; // 現在のステージで使用する問題リスト

// ハイスコアの管理
let highScores = [];

// ★変更点2: Audioオブジェクトの定義
const audio = {
    bgmMenu: new Audio('audio/clear.mp3'), // メインメニューのBGM (適宜変更)
    bgmGame: new Audio('audio/selkai2.mp3'), // ゲーム中のBGM (適宜変更)
    seCorrect: new Audio('audio/levelup.mp3'), // 正解時の効果音 (適宜変更)
    seIncorrect: new Audio('audio/sentou.mp3'), // 不正解時の効果音 (適宜変更)
    seButton: new Audio('audio/ponpon.mp3'), // ボタンクリック時の効果音 (適宜変更)
    seGameOver: new Audio('audio/maou.mp3'), // ゲームオーバー時の効果音 (適宜変更)
    seVictory: new Audio('audio/Royal_Question.mp3') // 勝利時の効果音 (適宜変更)
};

// BGMはループ再生
audio.bgmMenu.loop = true;
audio.bgmGame.loop = true;

// ページ読み込み時の初期化
window.addEventListener('DOMContentLoaded', async function() { // ★変更点3: asyncを追加
    // ★変更点4: JSONデータを読み込む
    await loadQuizData();
    initializeGame();
    loadHighScores();
    updateHighScoresDisplay();
    
    // メニューのクマを動かす
    const menuBear = document.getElementById('menu-bear');
    if (menuBear) {
        animateMenuBear();
    }
    
    // ★変更点5: メインメニューBGMの再生開始
    playBGM('menu');
});

// ★変更点6: quiz_data.jsonを読み込む関数
async function loadQuizData() {
    try {
        const response = await fetch('quiz_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        loadedQuizData = await response.json();
        console.log('Quiz data loaded:', loadedQuizData);
    } catch (error) {
        console.error('Error loading quiz data:', error);
        // エラー時はフォールバックとして空のデータを設定するか、エラーメッセージを表示
        loadedQuizData = {
            "サンプル": [
                { "question": "データ読み込みエラー", "options": ["A", "B", "C", "D"], "correct": 0 }
            ]
        };
    }
}

// ゲームの初期化
function initializeGame() {
    // 初期画面を表示
    showMainMenu();
    
    // ゲーム状態をリセット
    resetGameState();
}

// ゲーム状態のリセット
function resetGameState() {
    gameState = {
        score: 0,
        lives: 3,
        stage: 1,
        timer: 30,
        maxTimer: 30,
        isGameRunning: false,
        currentQuestionIndex: 0,
        hintsUsed: {
            freeze: 0,
            fifty: 0,
            skip: 0
        }
    };
    
    hintsRemaining = {
        freeze: 3,
        fifty: 3,
        skip: 2
    };
    
    isTimerFrozen = false;
    
    // ★変更点7: JSONから読み込んだデータを使って問題を準備
    prepareQuestionsForStage(gameState.stage);
}

// ★変更点8: ステージごとに問題を用意する関数
function prepareQuestionsForStage(stage) {
    const categories = Object.keys(loadedQuizData);
    if (categories.length === 0) {
        console.error("No quiz categories loaded.");
        currentQuestions = [];
        return;
    }

    currentQuestions = [];
    // 各カテゴリからランダムに問題を選ぶ、または全てのカテゴリの問題を混ぜる
    // 今回はシンプルに、全てのカテゴリの問題を結合してシャッフルします
    categories.forEach(category => {
        currentQuestions = currentQuestions.concat(loadedQuizData[category].map(q => ({
            question: q.question,
            answers: q.options, // JSONの'options'を'answers'にマッピング
            correct: q.correct
        })));
    });
    shuffleArray(currentQuestions);
    console.log("Current questions for stage:", currentQuestions);
}


// 配列をシャッフルする関数
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// メイン画面表示
function showMainMenu() {
    hideAllScreens();
    document.getElementById('main-menu').classList.remove('hidden');
    
    // メニューのクマの表情を普通に
    const menuBear = document.getElementById('menu-bear');
    if (menuBear) {
        menuBear.className = 'bear-sprite';
    }
    
    stopTimer();
    // ★変更点9: BGM切り替え
    playBGM('menu');
}

// 説明画面表示
function showInstructions() {
    hideAllScreens();
    document.getElementById('instructions').classList.remove('hidden');
    // ★変更点10: 効果音
    playSE('button');
}

// ランキング画面表示
function showHighScores() {
    hideAllScreens();
    document.getElementById('high-scores').classList.remove('hidden');
    updateHighScoresDisplay();
    // ★変更点11: 効果音
    playSE('button');
}

// 全ての画面を隠す
function hideAllScreens() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.add('hidden');
    });
}

// ゲーム開始
function startGame() {
    hideAllScreens();
    document.getElementById('game-screen').classList.remove('hidden');
    
    resetGameState();
    gameState.isGameRunning = true;
    
    // UI更新
    updateGameUI();
    updateHintButtons();
    
    // 最初の問題を表示
    showNextQuestion();
    
    // タイマー開始
    startTimer();
    
    // ゲームのクマを思考中の表情に
    const gameBear = document.getElementById('game-bear');
    if (gameBear) {
        gameBear.className = 'bear-sprite';
    }
    
    // クマのセリフを表示
    showBearMessage("助けて！問題に答えて！");
    
    // ★変更点12: BGM切り替え
    playBGM('game');
    playSE('button');
}

// ゲームのUI更新
function updateGameUI() {
    // スコア更新
    document.getElementById('score').textContent = gameState.score;
    
    // ステージ更新
    document.getElementById('stage').textContent = gameState.stage;
    
    // ライフ更新
    const hearts = document.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
        if (index < gameState.lives) {
            heart.classList.remove('lost');
        } else {
            heart.classList.add('lost');
        }
    });
    
    // タイマー更新
    updateTimerDisplay();
}

// 次の問題を表示
function showNextQuestion() {
    if (gameState.currentQuestionIndex >= currentQuestions.length) {
        // 全問題が終わったら次のステージへ
        gameState.stage++;
        gameState.maxTimer = Math.max(20, gameState.maxTimer - 2); // 段々難しく
        gameState.timer = gameState.maxTimer;
        // ★変更点13: 次のステージ用に問題を再準備
        prepareQuestionsForStage(gameState.stage);
        gameState.currentQuestionIndex = 0; // 新しい問題リストの最初から
        
        // 全てのステージをクリアした場合の勝利条件
        // 仮にステージ3をクリア条件とする (適宜変更)
        if (gameState.stage > 3) {
            victory();
            return;
        }
    }
    
    const question = currentQuestions[gameState.currentQuestionIndex];
    
    // 問題文を表示
    document.getElementById('question').textContent = question.question;
    
    // 選択肢を表示
    const answersContainer = document.getElementById('answers-container');
    answersContainer.innerHTML = '';
    
    question.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.textContent = answer;
        button.onclick = () => selectAnswer(index);
        answersContainer.appendChild(button);
    });
    
    // UI更新
    updateGameUI();
    
    // クマの表情をリセット（問題切り替え時）
    const gameBear = document.getElementById('game-bear');
    if (gameBear) {
        gameBear.className = 'bear-sprite';
    }
}

// 答えを選択
function selectAnswer(selectedIndex) {
    if (!gameState.isGameRunning) return;
    
    const question = currentQuestions[gameState.currentQuestionIndex];
    const isCorrect = selectedIndex === question.correct;
    
    // ボタンを無効化
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach((btn, index) => {
        btn.disabled = true;
        if (index === question.correct) {
            btn.classList.add('correct');
        } else if (index === selectedIndex && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // 結果に応じて処理
    if (isCorrect) {
        handleCorrectAnswer();
    } else {
        handleIncorrectAnswer();
    }
    
    // 次の問題へ進む
    setTimeout(() => {
        gameState.currentQuestionIndex++;
        showNextQuestion();
    }, 1500);
}

// 正解時の処理
function handleCorrectAnswer() {
    gameState.score += 10 * gameState.stage;
    gameState.timer = Math.min(gameState.maxTimer, gameState.timer + 5);
    
    // クマを嬉しい表情に
    const gameBear = document.getElementById('game-bear');
    if (gameBear) {
        gameBear.className = 'bear-sprite happy';
    }
    
    showBearMessage("やったー！ありがとう！");
    
    // ★変更点14: 正解音
    playSE('correct');
}

// 不正解時の処理
function handleIncorrectAnswer() {
    gameState.lives--;
    gameState.timer = Math.max(5, gameState.timer - 5);
    
    // クマを悲しい表情に
    const gameBear = document.getElementById('game-bear');
    if (gameBear) {
        gameBear.className = 'bear-sprite sad';
    }
    
    showBearMessage("あぁ...助けて...");
    
    // ★変更点15: 不正解音
    playSE('incorrect');

    // ライフが0になったらゲームオーバー
    if (gameState.lives <= 0) {
        setTimeout(() => {
            gameOver();
        }, 1500);
        return;
    }
}

// クマのメッセージ表示
function showBearMessage(message) {
    const bearSpeech = document.getElementById('bear-speech');
    const bearMessage = document.getElementById('bear-message');
    
    if (bearSpeech && bearMessage) {
        bearMessage.textContent = message;
        bearSpeech.classList.remove('hidden');
        
        // 3秒後に隠す
        setTimeout(() => {
            bearSpeech.classList.add('hidden');
        }, 3000);
    }
}

// タイマー開始
function startTimer() {
    stopTimer(); // 既存のタイマーを停止
    
    timerInterval = setInterval(() => {
        if (!isTimerFrozen && gameState.isGameRunning) {
            gameState.timer--;
            updateTimerDisplay();
            
            // 時間切れチェック
            if (gameState.timer <= 0) {
                gameOver();
            }
        }
    }, 1000);
}

// タイマー停止
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// タイマー表示更新
function updateTimerDisplay() {
    const timerText = document.getElementById('timer-text');
    const timerFill = document.getElementById('timer-fill');
    const gameBear = document.getElementById('game-bear');
    
    if (timerText) {
        timerText.textContent = gameState.timer;
        
        // 危険状態の表示
        if (gameState.timer <= 10) {
            timerText.classList.add('timer-danger');
        } else {
            timerText.classList.remove('timer-danger');
        }
    }
    
    if (timerFill) {
        const percentage = (gameState.timer / gameState.maxTimer) * 100;
        timerFill.style.width = Math.max(0, percentage) + '%';
    }

    // 残り時間に応じてクマの表情を変化
    if (gameBear && !gameBear.classList.contains('happy') && !gameBear.classList.contains('sad')) {
        if (gameState.timer <= 5) {
            gameBear.className = 'bear-sprite panic';
        } else if (gameState.timer <= 10) {
            gameBear.className = 'bear-sprite worried';
        } else {
            gameBear.className = 'bear-sprite';
        }
    }
}

// ヒント使用
function useHint(hintType) {
    if (!gameState.isGameRunning || hintsRemaining[hintType] <= 0) {
        return;
    }
    
    hintsRemaining[hintType]--;
    gameState.hintsUsed[hintType]++;
    
    switch (hintType) {
        case 'freeze':
            useTimeFreezeHint();
            break;
        case 'fifty':
            useFiftyFiftyHint();
            break;
        case 'skip':
            useSkipHint();
            break;
    }
    
    updateHintButtons();
    // ★変更点16: 効果音
    playSE('button');
}

// 時間停止ヒント
function useTimeFreezeHint() {
    isTimerFrozen = true;
    showBearMessage("時間が止まったよ！ゆっくり考えて！");
    
    // 10秒後に解除
    setTimeout(() => {
        isTimerFrozen = false;
        showBearMessage("時間が動き出した！");
    }, 10000);
}

// 50/50ヒント
function useFiftyFiftyHint() {
    const buttons = document.querySelectorAll('.answer-btn'); // 全てのボタンを取得
    const question = currentQuestions[gameState.currentQuestionIndex];
    
    let incorrectIndices = [];
    buttons.forEach((btn, index) => {
        if (index !== question.correct) {
            incorrectIndices.push(index);
        }
    });

    shuffleArray(incorrectIndices); // 不正解の選択肢をシャッフル

    // 2つの不正解の選択肢を隠す（または無効化）
    for (let i = 0; i < Math.min(2, incorrectIndices.length); i++) {
        const indexToHide = incorrectIndices[i];
        if (buttons[indexToHide]) {
            buttons[indexToHide].style.opacity = '0.3';
            buttons[indexToHide].disabled = true;
        }
    }
    
    showBearMessage("選択肢が減ったよ！");
}

// スキップヒント
function useSkipHint() {
    showBearMessage("問題をスキップしたよ！");
    gameState.currentQuestionIndex++;
    setTimeout(() => {
        showNextQuestion();
    }, 1000);
}

// ヒントボタンの更新
function updateHintButtons() {
    const hintButtons = {
        freeze: document.getElementById('hint-freeze'),
        fifty: document.getElementById('hint-fifty'),
        skip: document.getElementById('hint-skip')
    };
    
    const countElements = {
        freeze: document.getElementById('freeze-count'),
        fifty: document.getElementById('fifty-count'),
        skip: document.getElementById('skip-count')
    };
    
    Object.keys(hintsRemaining).forEach(hintType => {
        const button = hintButtons[hintType];
        const countElement = countElements[hintType];
        
        if (button && countElement) {
            countElement.textContent = hintsRemaining[hintType];
            
            if (hintsRemaining[hintType] <= 0) {
                button.disabled = true;
                button.style.opacity = '0.5';
            } else {
                button.disabled = false;
                button.style.opacity = '1';
            }
        }
    });
}

// ゲームオーバー
function gameOver() {
    gameState.isGameRunning = false;
    stopTimer();
    
    // スコアを保存
    saveScore();
    
    hideAllScreens();
    document.getElementById('game-over').classList.remove('hidden');
    
    // 最終スコア表示
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-stage').textContent = gameState.stage;
    
    // クマを悲しい表情に
    const gameOverBear = document.getElementById('game-over-bear');
    if (gameOverBear) {
        gameOverBear.className = 'bear-sprite sad';
    }

    // ★変更点17: BGM切り替えと効果音
    playBGM(null); // BGM停止
    playSE('gameOver');
}

// 勝利
function victory() {
    gameState.isGameRunning = false;
    stopTimer();
    
    saveScore();
    
    hideAllScreens();
    document.getElementById('victory').classList.remove('hidden');
    
    document.getElementById('victory-score').textContent = gameState.score;
    document.getElementById('victory-stage').textContent = gameState.stage;
    
    const victoryBear = document.getElementById('victory-bear');
    if (victoryBear) {
        victoryBear.className = 'bear-sprite happy';
    }

    // ★変更点18: BGM切り替えと効果音
    playBGM(null); // BGM停止
    playSE('victory');
}

// ゲーム再開
function restartGame() {
    resetGameState();
    startGame();
    // ★変更点19: 効果音
    playSE('button');
}

// スコア保存
function saveScore() {
    const newScore = {
        score: gameState.score,
        stage: gameState.stage,
        date: new Date().toLocaleDateString('ja-JP')
    };
    
    highScores.push(newScore);
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10); // 上位10位まで保持
    
    // 本来はlocalStorageなどに保存
    console.log('スコアを保存:', newScore);
    // localStorage.setItem('highScores', JSON.stringify(highScores));
}

// ハイスコア読み込み
function loadHighScores() {
    // 本来はlocalStorageから読み込む
    // const storedScores = localStorage.getItem('highScores');
    // if (storedScores) {
    //     highScores = JSON.parse(storedScores);
    // } else {
        highScores = [
            { score: 100, stage: 3, date: '2024/12/01' },
            { score: 80, stage: 2, date: '2024/12/01' },
            { score: 60, stage: 2, date: '2024/12/01' }
        ];
    // }
}

// ハイスコア表示更新
function updateHighScoresDisplay() {
    const scoresList = document.getElementById('scores-list');
    if (!scoresList) return;
    
    scoresList.innerHTML = '';
    
    if (highScores.length === 0) {
        scoresList.innerHTML = '<p style="text-align: center; color: #fff;">まだスコアがありません</p>';
        return;
    }
    
    highScores.forEach((score, index) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        scoreItem.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            margin-bottom: 0.5rem;
            background: rgba(255, 107, 53, 0.1);
            border-radius: 10px;
            border-left: 4px solid #ff6b35;
            color: #fff;
        `;
        
        scoreItem.innerHTML = `
            <span style="font-weight: bold; color: #ffa500;">${index + 1}位</span>
            <span style="font-size: 1.2rem; font-weight: bold;">${score.score}点</span>
            <span>ステージ${score.stage}</span>
            <span style="color: #ccc;">${score.date}</span>
        `;
        
        scoresList.appendChild(scoreItem);
    });
}

// メニューのクマアニメーション
function animateMenuBear() {
    const menuBear = document.getElementById('menu-bear');
    if (!menuBear) return;
    
    // ランダムに表情を変える
    const expressions = ['', 'happy', 'sad'];
    
    setInterval(() => {
        const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
        menuBear.className = 'bear-sprite ' + randomExpression;
    }, 3000);
}

// ★変更点20: BGM再生・停止関数
function playBGM(type) {
    // 全てのBGMを停止
    Object.values(audio).forEach(sound => {
        if (sound.loop) { // ループするものがBGMと仮定
            sound.pause();
            sound.currentTime = 0;
        }
    });

    if (type === 'menu' && audio.bgmMenu) {
        audio.bgmMenu.play().catch(e => console.error("Error playing menu BGM:", e));
    } else if (type === 'game' && audio.bgmGame) {
        audio.bgmGame.play().catch(e => console.error("Error playing game BGM:", e));
    }
}

// ★変更点21: 効果音再生関数
function playSE(type) {
    if (audio[type]) {
        // 再生前に現在の再生位置をリセットすることで、連続再生に対応
        audio[type].currentTime = 0; 
        audio[type].play().catch(e => console.error(`Error playing ${type} SE:`, e));
    }
}

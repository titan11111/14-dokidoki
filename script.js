// ゲーム状態管理
let gameState = {
    currentSubject: '',
    questions: {},
    currentQuestion: null,
    currentQuestionIndex: 0,
    score: 0,
    lives: 3,
    timeLeft: 10,
    timerInterval: null,
    questionPool: [],
    shuffledOptions: [],
    correctAnswerIndex: -1
};

// キャラクター画像マッピング - ファイルパスを.pngに修正
const characterImages = {
    normal: 'images/ChatGPT Image 2025年6月13日 21_11_08.png',  // 通常の笑顔
    happy: 'images/ChatGPT Image 2025年6月13日 21_11_06.png',   // 嬉しい表情用
    sad: 'images/ChatGPT Image 2025年6月13日 21_11_05.png',     // 悲しい表情用
    worried: 'images/ChatGPT Image 2025年6月13日 21_11_09.png', // 困った表情用
    veryHappy: 'images/ChatGPT Image 2025年6月13日 21_11_10.png' // とても嬉しい表情用
};

// オーディオ要素の参照 - 新しいBGMのIDに更新
const audioElements = {
    bgmTitle: document.getElementById('bgmTitle'), // audio/ponpon.mp3 (New)
    bgmSubjectSelect: document.getElementById('bgmSubjectSelect'), // audio/Ready_for_Comrade.mp3 (New)
    bgmQuiz: document.getElementById('bgmQuiz'), // audio/Royal_Question.mp3 (New)
    seikai: document.getElementById('seikaiSound'), // audio/seikai2.mp3
    fuseikai: document.getElementById('fuseikaiSound'), // audio/fuseikai2.mp3
    gameOver: document.getElementById('gameOverSound'), // audio/maou.mp3
    levelUp: document.getElementById('levelUpSound') // audio/levelup.mp3
};

function playSound(soundName) {
    if (audioElements[soundName]) {
        audioElements[soundName].currentTime = 0; // 最初から再生
        audioElements[soundName].play().catch(e => console.error("Error playing sound:", soundName, e)); // エラーハンドリングを追加
    }
}

function stopSound(soundName) {
    if (audioElements[soundName]) {
        audioElements[soundName].pause(); // 停止
        audioElements[soundName].currentTime = 0; // 再生位置をリセット
    }
}

// 全てのBGMを停止する関数を新しいBGMに合わせて修正
function stopAllBGM() {
    if (audioElements.bgmTitle) audioElements.bgmTitle.pause();
    if (audioElements.bgmSubjectSelect) audioElements.bgmSubjectSelect.pause();
    if (audioElements.bgmQuiz) audioElements.bgmQuiz.pause();
    // ゲームオーバー音はループしないはずですが、念のためここでも停止を試みる
    if (audioElements.gameOver) { 
        audioElements.gameOver.pause();
        audioElements.gameOver.currentTime = 0;
    }
}

// 画面切り替え関数
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// showTitleScreen ではBGMを直接再生しないように変更
function showTitleScreen() {
    showScreen('title-screen');
    resetGame();
    changeCharacterExpression('normal'); // タイトル画面に戻る際にキャラクターをノーマルにする
    stopAllBGM(); // 他のBGMを停止  <-- ここでゲームオーバー音も停止されるはず
    // playSound('bgmTitle'); // ここは削除またはコメントアウト
}

// 新しい関数: ゲームスタートボタンクリック時に呼び出す
function startGameAndPlayBGM() {
    playSound('bgmTitle'); // タイトル画面のBGMを再生
    showSubjectSelect(); // その後、科目選択画面へ遷移
}

// showSubjectSelect で新しいBGMを再生する前に、既存のBGMを停止
function showSubjectSelect() {
    stopAllBGM(); // ★追加: 科目選択画面に遷移する際に全てのBGMを停止 (ゲームオーバー音を含む)
    showScreen('subject-select');
    changeCharacterExpression('normal'); // 科目選択画面でキャラクターをノーマルにする
    playSound('bgmSubjectSelect'); // 科目選択画面で新しいBGMを再生
}

function showQuizScreen() {
    showScreen('quiz-screen');
    changeCharacterExpression('normal'); // クイズ画面でキャラクターをノーマルにする
    stopAllBGM(); // 他のBGMを停止
    playSound('bgmQuiz'); // クイズ画面で新しいBGMを再生
}

function showGameOverScreen() {
    showScreen('gameover-screen');
    document.getElementById('final-score').textContent = gameState.score;
    
    // ゲームオーバーメッセージ
    let message = '';
    stopAllBGM(); // 他のBGMを停止 (この直後に gameOver 音を再生するため、ここでは他のBGMを停止)
    if (gameState.score >= 5) { // Assuming a threshold for good score. Adjust as needed.
        message = '素晴らしい！勉強の成果が出てるね！';
        changeCharacterExpression('veryHappy'); // 高得点でとても嬉しい表情
        playSound('levelUp'); // 高得点でレベルアップ音を再生
    } else if (gameState.score >= 2) { // Assuming a threshold for medium score. Adjust as needed.
        message = 'なかなか良い調子！もう少し頑張ろう！';
        changeCharacterExpression('happy'); // 中程度のスコアで嬉しい表情
    } else {
        message = 'まだまだ伸びしろがあるよ！復習してみよう！';
        changeCharacterExpression('sad'); // 低得点で悲しい表情
        playSound('gameOver'); // ★ゲームオーバー音をここで再生
    }
    document.getElementById('gameover-message').textContent = message;
}

// ゲーム初期化
function resetGame() {
    gameState.score = 0;
    gameState.lives = 3;
    gameState.timeLeft = 10;
    gameState.currentQuestionIndex = 0;
    clearInterval(gameState.timerInterval);
    updateUI();
}

// UI更新
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('timer').textContent = gameState.timeLeft;
    
    // ライフ表示更新
    const livesElement = document.getElementById('lives');
    livesElement.innerHTML = '';
    for (let i = 0; i < gameState.lives; i++) {
        livesElement.innerHTML += '<span class="heart">❤️</span>';
    }
    for (let i = gameState.lives; i < 3; i++) {
        livesElement.innerHTML += '<span class="heart" style="opacity:0.3">💔</span>';
    }
}

// キャラクター表情変更
function changeCharacterExpression(expression) {
    const characterImg = document.getElementById('character-img');
    if (characterImg && characterImages[expression]) {
        characterImg.src = characterImages[expression];
    }
}

// 配列シャッフル関数
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 問題データ読み込み
async function loadQuestions() {
    try {
        // 'questions.json'ではなく'quiz_data.json'を使用する
        const response = await fetch('quiz_data.json');
        if (!response.ok) {
            throw new Error('問題データの読み込みに失敗しました');
        }
        gameState.questions = await response.json();
        console.log('問題データを読み込みました');
    } catch (error) {
        console.error('エラー:', error);
        // エラー発生時は、ユーザーにエラーメッセージを表示するなど、適切なハンドリングを行う
        alert('問題データの読み込み中にエラーが発生しました。ゲームを続行できません。');
        showTitleScreen(); // タイトル画面に戻すなど
    }
}

// ゲーム開始
async function startGame(subject) {
    gameState.currentSubject = subject;
    // 問題データがまだ読み込まれていない場合のみ読み込む
    if (Object.keys(gameState.questions).length === 0) {
        await loadQuestions(); 
    }
    
    // 選択された科目の問題があるかチェック
    if (!gameState.questions[subject] || gameState.questions[subject].length === 0) {
        console.error(`選択された科目 '${subject}' の問題が見つかりません。`);
        alert('この科目にはまだ問題がありません。別の科目を選択してください。');
        return;
    }

    gameState.questionPool = shuffleArray(gameState.questions[subject]);
    resetGame();
    showQuizScreen();
    startNextQuestion();
}

// 次の問題を開始
function startNextQuestion() {
    clearInterval(gameState.timerInterval); // 前のタイマーをクリア
    document.getElementById('result-display').classList.add('hidden'); // 結果表示を非表示にする
    
    // 選択肢ボタンをリセット
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(button => {
        button.classList.remove('correct', 'incorrect', 'disabled');
        button.style.backgroundColor = ''; // CSSで設定された背景色に戻す
        button.style.borderColor = '';     // CSSで設定されたボーダー色に戻す
    });

    if (gameState.currentQuestionIndex < gameState.questionPool.length) {
        gameState.currentQuestion = gameState.questionPool[gameState.currentQuestionIndex];
        displayQuestion(gameState.currentQuestion);
        gameState.timeLeft = 10; // タイマーをリセット
        updateUI();
        startTimer();
        changeCharacterExpression('normal'); // 問題表示時にノーマルに戻す
    } else {
        // 全問終了後の処理（例: 最終スコア表示、ゲームオーバー画面へ遷移）
        showGameOverScreen();
    }
}

// 問題表示
function displayQuestion(question) {
    document.getElementById('question-text').textContent = question.question;

    // 選択肢をシャッフル
    gameState.shuffledOptions = shuffleArray(question.options);
    // 正しい答えのインデックスを、シャッフル後の選択肢での位置で取得
    // quiz_data.json の correct は元の options 配列内のインデックスを指すため、
    // その値を使って正しい答えのテキストを取得し、シャッフル後の配列での位置を探す
    const correctOptionText = question.options[question.correct];
    gameState.correctAnswerIndex = gameState.shuffledOptions.indexOf(correctOptionText);

    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach((button, index) => {
        button.querySelector('.option-text').textContent = gameState.shuffledOptions[index];
        button.disabled = false; // ボタンを有効にする
    });
}

// 回答選択
function selectAnswer(selectedIndex) {
    clearInterval(gameState.timerInterval); // タイマーを停止
    
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(button => {
        button.disabled = true; // 全てのボタンを無効にする
        button.classList.add('disabled');
    });

    const selectedButton = optionButtons[selectedIndex];

    if (selectedIndex === gameState.correctAnswerIndex) {
        // 正解
        gameState.score++;
        document.getElementById('result-text').textContent = '正解！';
        selectedButton.classList.add('correct');
        changeCharacterExpression('happy'); // 正解で嬉しい表情
        playSound('seikai'); // 正解音を再生
    } else {
        // 不正解
        gameState.lives--;
        document.getElementById('result-text').textContent = '不正解！';
        selectedButton.classList.add('incorrect');
        // 正解の選択肢をハイライト
        optionButtons[gameState.correctAnswerIndex].classList.add('correct');
        
        changeCharacterExpression('sad'); // 不正解で悲しい表情
        playSound('fuseikai'); // 不正解音を再生

        if (gameState.lives <= 0) {
            // ライフがなくなったらゲームオーバー
            updateUI(); // ライフの更新を先に反映
            setTimeout(() => showGameOverScreen(), 1000); // 少し遅れてゲームオーバー画面へ
            return; // ゲームオーバーなのでここで処理を終了
        }
    }
    updateUI();
    document.getElementById('result-display').classList.remove('hidden');
    gameState.currentQuestionIndex++;
}

// 「次の問題」ボタンがクリックされたときに呼ばれる関数
function nextQuestion() {
    startNextQuestion();
}

// タイマー開始
function startTimer() {
    const timerElement = document.getElementById('timer');
    timerElement.classList.remove('timer-warning'); // 警告色をリセット
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        timerElement.textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 5) { // 5秒以下で警告色
            timerElement.classList.add('timer-warning');
        }

        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            document.getElementById('result-text').textContent = '時間切れ！';
            
            gameState.lives--;
            
            // 正解の選択肢をハイライト
            const optionButtons = document.querySelectorAll('.option-btn');
            optionButtons.forEach(button => {
                button.disabled = true; // 全てのボタンを無効にする
                button.classList.add('disabled');
            });
            optionButtons[gameState.correctAnswerIndex].classList.add('correct'); // 時間切れでも正解を表示
            
            changeCharacterExpression('worried'); // 時間切れで困った表情
            playSound('fuseikai'); // 時間切れも不正解扱いなので不正解音を再生
            updateUI(); // ライフの更新を反映

            document.getElementById('result-display').classList.remove('hidden');
            
            if (gameState.lives <= 0) {
                setTimeout(() => showGameOverScreen(), 1000);
            } else {
                // 時間切れの場合も`currentQuestionIndex`をインクリメントし、`startNextQuestion`を呼ぶ
                gameState.currentQuestionIndex++;
            }
        }
    }, 1000);
}

// DOM読み込み完了後に初期表示
document.addEventListener('DOMContentLoaded', () => {
    showTitleScreen();
    // 問題データはstartGame()で科目選択時に呼び出すので、ここで呼び出す必要はない
});

// デバッグ用関数（必要に応じて使用）
function skipQuestion() {
    // 開発/デバッグ用途のため、本番では削除またはコメントアウト
    gameState.currentQuestionIndex++;
    startNextQuestion();
}
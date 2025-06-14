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
    correctAnswerIndex: -1,
    totalQuestionsAnswered: 0 // 回答した問題の総数
};

// キャラクター画像マッピング - ファイルパスを.pngに修正
const characterImages = {
    normal: 'images/ChatGPT Image 2025年6月13日 21_11_08.png',  // 通常の笑顔
    happy: 'images/ChatGPT Image 2025年6月13日 21_11_06.png',   // 嬉しい表情用
    sad: 'images/ChatGPT Image 2025年6月13日 21_11_05.png',     // 悲しい表情用
    worried: 'images/ChatGPT Image 2025年6月13日 21_11_09.png', // 困った表情用 (絶望/非常に悪い時にも使用)
    veryHappy: 'images/ChatGPT Image 2025年6月13日 21_11_10.png' // とても嬉しい表情用
};

// オーディオ要素の参照
const audioElements = {
    bgmTitle: document.getElementById('bgmTitle'),
    bgmSubjectSelect: document.getElementById('bgmSubjectSelect'),
    bgmQuiz: document.getElementById('bgmQuiz'),
    seikai: document.getElementById('seikaiSound'),
    fuseikai: document.getElementById('fuseikaiSound'),
    gameOver: document.getElementById('gameOverSound'),
    levelUp: document.getElementById('levelUpSound')
};

function playSound(soundName) {
    if (audioElements[soundName]) {
        audioElements[soundName].currentTime = 0;
        audioElements[soundName].play().catch(e => console.error("Error playing sound:", soundName, e));
    }
}

function stopSound(soundName) {
    if (audioElements[soundName]) {
        audioElements[soundName].pause();
        audioElements[soundName].currentTime = 0;
    }
}

function stopAllBGM() {
    if (audioElements.bgmTitle) audioElements.bgmTitle.pause();
    if (audioElements.bgmSubjectSelect) audioElements.bgmSubjectSelect.pause();
    if (audioElements.bgmQuiz) audioElements.bgmQuiz.pause();
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

function showTitleScreen() {
    showScreen('title-screen');
    resetGame();
    changeCharacterExpression('normal'); // タイトル画面に戻る際にキャラクターをノーマルにする
    stopAllBGM();
    hideExplanationModal(); // Ensure modal is hidden
}

function startGameAndPlayBGM() {
    playSound('bgmTitle');
    showSubjectSelect();
}

function showSubjectSelect() {
    stopAllBGM();
    showScreen('subject-select');
    changeCharacterExpression('normal'); // 科目選択画面でキャラクターをノーマルにする
    playSound('bgmSubjectSelect');
    hideExplanationModal(); // Ensure modal is hidden
}

function showQuizScreen() {
    showScreen('quiz-screen');
    changeCharacterExpression('normal'); // クイズ画面でキャラクターをノーマルにする
    stopAllBGM();
    playSound('bgmQuiz');
    hideExplanationModal(); // Ensure modal is hidden
}

function showGameOverScreen() {
    showScreen('gameover-screen');
    document.getElementById('final-score').textContent = gameState.score;
    
    let message = '';
    stopAllBGM();
    playSound('gameOver');

    // 正答率の計算
    const totalAnswered = gameState.totalQuestionsAnswered;
    const accuracy = totalAnswered > 0 ? (gameState.score / totalAnswered) * 100 : 0; // 0除算を避ける

    // 正答率に基づいて表情とメッセージを決定 (5段階)
    if (accuracy === 100) { // 100%正解
        message = '完璧！君は真の天才だ！';
        changeCharacterExpression('veryHappy');
        playSound('levelUp'); 
    } else if (accuracy >= 80) { // 80%以上99%以下
        message = '素晴らしい！よく頑張ったね！';
        changeCharacterExpression('happy');
    } else if (accuracy >= 50) { // 50%以上79%以下
        message = 'なかなか良い調子！もっと上を目指そう！';
        changeCharacterExpression('normal'); 
    } else if (accuracy >= 20) { // 20%以上49%以下 (やや嬉しいと悲しみの中間、困った顔が適切)
        message = 'もう少し頑張れば、もっとできるよ！';
        changeCharacterExpression('worried'); 
    } else { // 0%以上19%以下 (絶望/悲しみ)
        message = 'まだまだ伸びしろがあるよ！復習してみよう！';
        changeCharacterExpression('sad');
    }
    
    document.getElementById('gameover-message').textContent = message;
    
    // 次のゲームのためにtotalQuestionsAnsweredをリセット
    gameState.totalQuestionsAnswered = 0; 
    hideExplanationModal(); // Ensure modal is hidden
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
        livesElement.innerHTML += '<span class="heart faded">❤️</span>'; // 不正解時に透明度を下げる
    }
}

// キャラクター表情変更
function changeCharacterExpression(expression) {
    const titleCharacterImg = document.getElementById('title-character-img'); // タイトル画面
    const subjectSelectCharacterImg = document.getElementById('subject-select-character-img'); // 科目選択画面
    const quizCharacterImg = document.getElementById('quiz-character-img'); // クイズ画面
    const gameOverCharacterImg = document.getElementById('gameover-character-img'); // ゲームオーバー画面

    if (characterImages[expression]) {
        const imageUrl = characterImages[expression];
        // Use a placeholder image if the specified image fails to load
        if (titleCharacterImg) titleCharacterImg.src = imageUrl;
        if (subjectSelectCharacterImg) subjectSelectCharacterImg.src = imageUrl;
        if (quizCharacterImg) quizCharacterImg.src = imageUrl;
        if (gameOverCharacterImg) gameOverCharacterImg.src = imageUrl;
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
        const response = await fetch('quiz_data.json');
        if (!response.ok) {
            throw new Error('問題データの読み込みに失敗しました');
        }
        gameState.questions = await response.json();
        console.log('問題データを読み込みました');
    } catch (error) {
        console.error('エラー:', error);
        alert('問題データの読み込み中にエラーが発生しました。ゲームを続行できません。');
        showTitleScreen(); // エラー時はタイトル画面に戻す
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
    gameState.totalQuestionsAnswered = 0; // ゲーム開始時に回答数をリセット
    showQuizScreen();
    startNextQuestion();
}

// 次の問題を開始
function startNextQuestion() {
    clearInterval(gameState.timerInterval); // 前のタイマーをクリア
    document.getElementById('result-display').classList.add('hidden'); // 結果表示を非表示にする
    hideExplanationModal(); // Ensure modal is hidden

    // 選択肢ボタンをリセット
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(button => {
        button.disabled = false;
        button.classList.remove('correct', 'incorrect', 'disabled');
    });

    if (gameState.currentQuestionIndex < gameState.questionPool.length) {
        gameState.currentQuestion = gameState.questionPool[gameState.currentQuestionIndex];
        document.getElementById('question-text').textContent = gameState.currentQuestion.question;

        // 選択肢をシャッフルし、正しい選択肢のインデックスを保存
        gameState.shuffledOptions = shuffleArray(gameState.currentQuestion.options);
        gameState.correctAnswerIndex = gameState.shuffledOptions.indexOf(gameState.currentQuestion.options[gameState.currentQuestion.correct]);

        const optionElements = document.querySelectorAll('.option-text');
        optionElements.forEach((element, index) => {
            element.textContent = gameState.shuffledOptions[index];
        });

        gameState.timeLeft = 10; // タイマーリセット
        document.getElementById('timer').classList.remove('timer-warning'); // 警告表示をリセット
        updateUI();
        startTimer();
    } else {
        // 全問終了
        showGameOverScreen(); // ゲーム終了画面へ遷移
    }
}

// 解答選択
function selectAnswer(selectedIndex) {
    clearInterval(gameState.timerInterval); // タイマー停止
    gameState.totalQuestionsAnswered++; // 回答数をカウント

    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(button => {
        button.disabled = true; // 全ての選択肢を無効化
        button.classList.add('disabled'); // 無効化スタイルを追加
    });

    const isCorrect = (selectedIndex === gameState.shuffledOptions.indexOf(gameState.currentQuestion.options[gameState.currentQuestion.correct]));
    
    if (isCorrect) {
        document.getElementById('result-text').textContent = '正解！';
        optionButtons[selectedIndex].classList.add('correct');
        gameState.score++;
        changeCharacterExpression('happy');
        playSound('seikai');
    } else {
        document.getElementById('result-text').textContent = '不正解…';
        optionButtons[selectedIndex].classList.add('incorrect');
        optionButtons[gameState.correctAnswerIndex].classList.add('correct'); // 正しい選択肢をハイライト
        gameState.lives--;
        changeCharacterExpression('sad');
        playSound('fuseikai');
    }

    updateUI();
    document.getElementById('result-display').classList.remove('hidden');

    // Show explanation modal after a short delay
    setTimeout(() => {
        showExplanationModal();
    }, 1000); // Wait for 1 second before showing modal
}

// Explanation Modal Functions
function showExplanationModal() {
    const explanationModalOverlay = document.getElementById('explanation-modal-overlay');
    const explanationText = document.getElementById('explanation-text');
    
    if (gameState.currentQuestion.explanation) {
        explanationText.textContent = gameState.currentQuestion.explanation;
    } else {
        explanationText.textContent = "ごめんなさい、この問題の解説はありません。";
    }
    explanationModalOverlay.classList.remove('hidden');
}

function hideExplanationModal() {
    const explanationModalOverlay = document.getElementById('explanation-modal-overlay');
    explanationModalOverlay.classList.add('hidden');
}


// 次の問題ボタン (Now handles modal hiding)
function nextQuestion() {
    hideExplanationModal(); // Hide the explanation modal first
    // ライフが0の場合はゲームオーバー画面へ、そうでない場合は次の問題へ
    if (gameState.lives <= 0) {
        showGameOverScreen();
    } else {
        gameState.currentQuestionIndex++;
        startNextQuestion();
    }
}

// タイマー開始
function startTimer() {
    const timerElement = document.getElementById('timer');
    timerElement.classList.remove('timer-warning'); // 新しい問題で警告表示をリセット
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        timerElement.textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 5) {
            timerElement.classList.add('timer-warning');
        }

        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            document.getElementById('result-text').textContent = '時間切れ！';
            
            gameState.lives--;
            
            const optionButtons = document.querySelectorAll('.option-btn');
            optionButtons.forEach(button => {
                button.disabled = true;
                button.classList.add('disabled');
            });
            // 時間切れの場合も正解を表示
            optionButtons[gameState.correctAnswerIndex].classList.add('correct');
            
            changeCharacterExpression('worried');
            playSound('fuseikai');
            updateUI();

            document.getElementById('result-display').classList.remove('hidden');
            gameState.totalQuestionsAnswered++; // 回答数をカウント (時間切れも含む)

            setTimeout(() => {
                showExplanationModal();
            }, 1000); // Show modal after delay

            // Game over check will happen when "Next Question" is clicked from modal
        }
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    showTitleScreen();
    // Pre-load questions to avoid delay on first subject selection
    loadQuestions(); 
});

// デバッグ用関数（必要に応じて使用）
function skipQuestion() {
    gameState.currentQuestionIndex++;
    startNextQuestion();
}

import { generatePuzzleData } from './src/puzzle-generator.js';
const selectedBgColor = '#e6f7ff'
document.addEventListener('DOMContentLoaded', () => {
    const crosswordGrid = document.getElementById('crossword-grid');
    const acrossClues = document.getElementById('across-clues');
    const downClues = document.getElementById('down-clues');
    const checkBtn = document.getElementById('check-btn');
    const resetBtn = document.getElementById('reset-btn');
    const previewBtn = document.getElementById('preview-btn');
    const message = document.getElementById('message');
    let puzzleData = null;
    let currentInput = null;



    // 加载鸟类数据
    fetch('data/birdsData.json')
        .then(response => response.json())
        .then(birds => {
            // 筛选出2-5个字的鸟类名称
            const validBirds = birds.filter(bird =>
                typeof bird.name === 'string' &&
                bird.name.length >= 2 &&
                bird.name.length <= 5
            );
            // 从最小、最大值之间随机选择一个数量
            const minCnt = 10;
            const maxCnt = 15;
            const randomCnt = Math.floor(Math.random() * (maxCnt - minCnt + 1)) + minCnt;


            // 随机选择8个鸟类
            const selectedBirds = selectRandomBirds(validBirds, randomCnt);
            // 生成填字游戏数据
            puzzleData = generatePuzzleData(selectedBirds);
            console.log(puzzleData)
            createGrid(puzzleData);
            createClues(puzzleData);
        })
        .catch(error => {
            console.error('Error loading birds data:', error);
            message.textContent = '加载鸟类数据失败，请确保birdsData.json存在且格式正确。';
        });

    // 创建填字游戏网格
    function createGrid(data) {
        crosswordGrid.style.gridTemplateColumns = `repeat(${data.width}, 1fr)`;

        data.grid.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const cellElement = document.createElement('div');
                cellElement.classList.add('cell');
                cellElement.dataset.row = rowIndex;
                cellElement.dataset.col = colIndex;

                if (cell === 'black') {
                    cellElement.classList.add('black');
                    crosswordGrid.appendChild(cellElement);
                    return;
                }

                // 添加单元格编号
                if (cell.number) {
                    const numberElement = document.createElement('div');
                    numberElement.classList.add('cell-number');
                    numberElement.textContent = cell.number;
                    cellElement.appendChild(numberElement);

                    // 添加点击事件以高亮单词
                    numberElement.addEventListener('click', (e) => {
                        // 获取点击的数字并转换为整数
                        const targetNumber = parseInt(e.target.textContent, 10);
                        console.log('Clicked number:', targetNumber);
                        currentInput = inputElement;
                        highlightWord(targetNumber); // 传递数字参数
                    });
                }

                // 添加输入框
                const inputElement = document.createElement('input');
                inputElement.maxLength = 1;
                inputElement.dataset.answer = cell.answer || '';
                inputElement.dataset.row = rowIndex;
                inputElement.dataset.col = colIndex;
                cellElement.appendChild(inputElement);

                crosswordGrid.appendChild(cellElement);
            });
        });
    }

    // 创建线索列表
    function createClues(data) {
        // 横向线索
        data.acrossClues.forEach(clue => {
            const clueElement = document.createElement('div');
            clueElement.classList.add('clue');
            clueElement.innerHTML = `<span class="clue-number">${clue.number}.</span> ${clue.text}`;
            acrossClues.appendChild(clueElement);
        });

        // 纵向线索
        data.downClues.forEach(clue => {
            const clueElement = document.createElement('div');
            clueElement.classList.add('clue');
            clueElement.innerHTML = `<span class="clue-number">${clue.number}.</span> ${clue.text}`;
            downClues.appendChild(clueElement);
        });
    }

    // 根据数字高亮对应的单词
    function highlightWord(targetNumber) {
        // 清除之前的高亮
        document.querySelectorAll('.cell input').forEach(input => {
            input.style.backgroundColor = '';
        });
        const highlightCells = puzzleData.wordPositions[targetNumber]
        console.log(highlightCells)
        highlightCells.forEach(pos => {
            const row = pos[0]
            const col = pos[1]
            const cell = document.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
            console.log(cell)
            if (cell) {
                cell.style.backgroundColor = selectedBgColor;
            }
        })
    }

    // 预览答案
    function previewAnswer() {
        if (!puzzleData) return;

        const inputs = document.querySelectorAll('.cell input');
        inputs.forEach(input => {
            const answer = input.dataset.answer;
            input.value = answer;
            input.style.backgroundColor = selectedBgColor;
        });
    }

    // 预览答案按钮事件
    previewBtn.addEventListener('click', previewAnswer);

    // 检查答案
    checkBtn.addEventListener('click', () => {
        if (!puzzleData) return;

        let correct = true;
        const inputs = document.querySelectorAll('.cell input');

        inputs.forEach(input => {
            const answer = input.dataset.answer;
            if (input.value.toUpperCase() !== answer.toUpperCase()) {
                input.style.backgroundColor = '#fff1f0';
                correct = false;
            } else {
                input.style.backgroundColor = '#f6ffed';
            }
        });

        if (correct) {
            message.textContent = '恭喜你，全部答对了！';
            message.style.color = '#52c41a';
        } else {
            message.textContent = '有些答案不正确，请检查并修改。';
            message.style.color = '#f5222d';
        }
    });

    // 重置
    resetBtn.addEventListener('click', () => {
        document.querySelectorAll('.cell input').forEach(input => {
            input.value = '';
            input.style.backgroundColor = '';
        });
        message.textContent = '';
        currentInput = null;
    });


});

// 随机选择鸟类
function selectRandomBirds(birds, count) {
    // 复制数组以避免修改原数组
    const shuffled = [...birds].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}


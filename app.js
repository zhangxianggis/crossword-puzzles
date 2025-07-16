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

    // 加载JSON配置文件
    fetch('puzzle_config.json')
        .then(response => response.json())
        .then(data => {
            puzzleData = data;
            createGrid(data);
            createClues(data);
        })
        .catch(error => {
            console.error('Error loading puzzle configuration:', error);
            message.textContent = '加载配置文件失败，请确保puzzle_config.json存在且格式正确。';
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
                }

                // 添加输入框
                const inputElement = document.createElement('input');
                inputElement.maxLength = 1;
                inputElement.dataset.answer = cell.answer || '';
                inputElement.dataset.row = rowIndex;
                inputElement.dataset.col = colIndex;
                cellElement.appendChild(inputElement);

                // 输入框事件监听
                inputElement.addEventListener('focus', () => {
                    currentInput = inputElement;
                    highlightWord(rowIndex, colIndex);
                });

                inputElement.addEventListener('input', (e) => {
                    if (e.target.value) {
                        // 自动跳到下一个单元格
                        const nextInput = getNextInput(rowIndex, colIndex);
                        if (nextInput) nextInput.focus();
                    }
                });

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

    // 判断是否为横向单词的起始位置
    function isAcrossWord(row, col) {
        // 如果当前单元格右侧有单元格且不是黑色，则是横向单词
        if (col + 1 < puzzleData.width && puzzleData.grid[row][col + 1] !== 'black') {
            // 如果是第一个单元格或左侧是黑色，则是横向单词的起始位置
            return col === 0 || puzzleData.grid[row][col - 1] === 'black';
        }
        return false;
    }

    // 判断是否为纵向单词的起始位置
    function isDownWord(row, col) {
        // 如果当前单元格下方有单元格且不是黑色，则是纵向单词
        if (row + 1 < puzzleData.height && puzzleData.grid[row + 1][col] !== 'black') {
            // 如果是第一行或上方是黑色，则是纵向单词的起始位置
            return row === 0 || puzzleData.grid[row - 1][col] === 'black';
        }
        return false;
    }

    // 高亮当前单词
    function highlightWord(row, col) {
        // 清除之前的高亮
        document.querySelectorAll('.cell input').forEach(input => {
            input.parentElement.style.backgroundColor = '';
        });

        if (!currentInput) return;

        // 判断当前是横向还是纵向
        const isAcross = currentInput.dataset.direction === 'across' ||
            (currentInput.dataset.direction === undefined &&
                isAcrossWord(row, col));

        currentInput.dataset.direction = isAcross ? 'across' : 'down';

        // 高亮当前单词的所有单元格
        let cells = [];
        if (isAcross) {
            // 横向单词
            for (let j = col; j < puzzleData.width; j++) {
                const cell = puzzleData.grid[row][j];
                if (cell === 'black') break;
                cells.push({ row, col: j });
            }
        } else {
            // 纵向单词
            for (let i = row; i < puzzleData.height; i++) {
                const cell = puzzleData.grid[i][col];
                if (cell === 'black') break;
                cells.push({ row: i, col });
            }
        }

        // 高亮
        cells.forEach(({ row, col }) => {
            const input = document.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
            if (input) input.parentElement.style.backgroundColor = '#e6f7ff';
        });
    }

    // 获取下一个输入框
    function getNextInput(row, col) {
        if (!currentInput) return null;

        const isAcross = currentInput.dataset.direction === 'across';
        if (isAcross) {
            // 横向移动
            for (let j = col + 1; j < puzzleData.width; j++) {
                const cell = puzzleData.grid[row][j];
                if (cell === 'black') break;
                const nextInput = document.querySelector(`input[data-row="${row}"][data-col="${j}"]`);
                if (nextInput) return nextInput;
            }
            // 横向结束，尝试移动到下一行第一个输入框
            for (let i = row + 1; i < puzzleData.height; i++) {
                for (let j = 0; j < puzzleData.width; j++) {
                    const cell = puzzleData.grid[i][j];
                    if (cell !== 'black') {
                        const nextInput = document.querySelector(`input[data-row="${i}"][data-col="${j}"]`);
                        if (nextInput) return nextInput;
                    }
                }
            }
        } else {
            // 纵向移动
            for (let i = row + 1; i < puzzleData.height; i++) {
                const cell = puzzleData.grid[i][col];
                if (cell === 'black') break;
                const nextInput = document.querySelector(`input[data-row="${i}"][data-col="${col}"]`);
                if (nextInput) return nextInput;
            }
            // 纵向结束，尝试移动到下一列第一个输入框
            for (let j = col + 1; j < puzzleData.width; j++) {
                for (let i = 0; i < puzzleData.height; i++) {
                    const cell = puzzleData.grid[i][j];
                    if (cell !== 'black') {
                        const nextInput = document.querySelector(`input[data-row="${i}"][data-col="${j}"]`);
                        if (nextInput) return nextInput;
                    }
                }
            }
        }

        return null;
}

    // 预览答案
    function previewAnswer() {
        if (!puzzleData) return;

        const inputs = document.querySelectorAll('.cell input');
        inputs.forEach(input => {
            const answer = input.dataset.answer;
            input.value = answer;
            input.style.backgroundColor = '#e6f7ff';
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

    // 键盘导航
    document.addEventListener('keydown', (e) => {
        if (!currentInput) return;

        const row = parseInt(currentInput.dataset.row);
        const col = parseInt(currentInput.dataset.col);
        let nextInput = null;

        switch (e.key) {
            case 'ArrowRight':
                nextInput = document.querySelector(`input[data-row="${row}"][data-col="${col + 1}"]`);
                break;
            case 'ArrowLeft':
                nextInput = document.querySelector(`input[data-row="${row}"][data-col="${col - 1}"]`);
                break;
            case 'ArrowDown':
                nextInput = document.querySelector(`input[data-row="${row + 1}"][data-col="${col}"]`);
                break;
            case 'ArrowUp':
                nextInput = document.querySelector(`input[data-row="${row - 1}"][data-col="${col}"]`);
                break;
            case 'Tab':
                e.preventDefault();
                nextInput = getNextInput(row, col);
                break;
        }

        if (nextInput) {
            currentInput = nextInput;
            currentInput.focus();
            highlightWord(parseInt(currentInput.dataset.row), parseInt(currentInput.dataset.col));
        }
    });
});
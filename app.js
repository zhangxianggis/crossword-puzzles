import { generatePuzzleData } from './src/puzzle-generator.js';
const selectedBgColor = '#e6f7ff'
document.addEventListener('DOMContentLoaded', () => {
    const crosswordGrid = document.getElementById('crossword-grid');
    const checkBtn = document.getElementById('check-btn');
    const resetBtn = document.getElementById('reset-btn');
    const previewBtn = document.getElementById('preview-btn');
    const message = document.getElementById('message');
    const wordInput = document.getElementById('word-input');
    const submitWordBtn = document.getElementById('submit-word');
    const speciesImage = document.getElementById('species-image');
    const imageLoading = document.getElementById('image-loading');
    const imageError = document.getElementById('image-error');
    let puzzleData = null;
    let currentInput = null;
    let currentWordPositions = [];
    let currentScientificName = '';



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
                        currentWordPositions = puzzleData.wordPositions[targetNumber];
                        highlightWord(targetNumber); // 传递数字参数
                        wordInput.value = '';
                        wordInput.focus();
                        // 获取对应的科学名称并加载图片
                        const targetClue = [...puzzleData.acrossClues, ...puzzleData.downClues].find(clue => clue.number === targetNumber);
                        debugger
                        if (targetClue && targetClue.obj) {
                            currentScientificName = targetClue.obj.scientificName;
                            fetchSpeciesImage(currentScientificName);
                        }
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

    // 提交答案按钮事件
    submitWordBtn.addEventListener('click', () => {
        if (currentWordPositions.length === 0 || !wordInput.value) return;

        const answer = wordInput.value.trim().toUpperCase();
        if (answer.length !== currentWordPositions.length) {
            message.textContent = `答案长度必须为${currentWordPositions.length}个字符`;
            message.style.color = '#faad14';
            return;
        }

        currentWordPositions.forEach((pos, index) => {
            const row = pos[0];
            const col = pos[1];
            const cell = document.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.value = answer[index];
            }
        });

        wordInput.value = '';
        message.textContent = '';
    });

    // 获取物种图片
    function fetchSpeciesImage(scientificName) {
        if (!scientificName) return;

        // 显示加载状态
        speciesImage.style.display = 'none';
        imageError.style.display = 'none';
        imageLoading.style.display = 'block';

        // 请求iNaturalist API
        fetch(`https://api.inaturalist.org/v1/taxa?rank=species&q=${encodeURIComponent(scientificName)}`)
            .then(response => {
                if (!response.ok) throw new Error('网络响应不正常');
                return response.json();
            })
            .then(data => {
                if (data.results && data.results.length > 0 && data.results[0].default_photo) {
                    const imageUrl = data.results[0].default_photo.medium_url;
                    speciesImage.src = imageUrl;
                    speciesImage.style.display = 'block';
                    imageError.style.display = 'none';
                } else {
                    throw new Error('未找到物种图片');
                }
            })
            .catch(error => {
                console.error('获取图片失败:', error);
                speciesImage.style.display = 'none';
                imageError.style.display = 'block';
            })
            .finally(() => {
                imageLoading.style.display = 'none';
            });
    }

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


// 生成填字游戏数据
export function generatePuzzleData(birds, width = 8, height = 8, maxCnt = null) {
    console.info(birds)
    // 创建10x10的网格
    // 使用传入的参数或默认值
    // const width = 10;
    // const height = 10;
    let grid = Array(height).fill().map(() => Array(width).fill('black'));

    let acrossClues = [];
    let downClues = [];
    let wordPositions = {};
    let currentNumber = 1;
    const defaultMaxCnt = Math.min(birds.length, Math.floor((width * height) / 5)); // 限制最大单词数为网格面积的1/5
    maxCnt = maxCnt !== null ? maxCnt : defaultMaxCnt;

    // 从鸟类数据中提取单词和线索
    const allWords = birds.map(bird => ({
        text: bird.name,
        obj: bird,
    }));

    // 优化的填字游戏生成算法
    function backtrack(remainingWords, currentGrid, currentAcross, currentDown, currentNum, wordPositions) {
        // 如果没有剩余单词或达到最大单词数，返回当前结果
        if (remainingWords.length === 0 || currentNum > maxCnt + 1) { // 使用currentNum跟踪已放置单词数
            return {
                success: true,
                grid: currentGrid,
                acrossClues: currentAcross,
                downClues: currentDown,
                wordPositions: wordPositions
            };
        }

        // 随机选择一个单词
        // 优先选择长度适中的单词提高匹配率
        const sortedWords = [...remainingWords].sort((a, b) => Math.abs(a.text.length - 5) - Math.abs(b.text.length - 5));
        const wordIndex = Math.min(Math.floor(Math.random() * 3), sortedWords.length - 1); // 从最优3个候选词中选择
        const word = remainingWords[wordIndex];
        const newRemaining = [...remainingWords.slice(0, wordIndex), ...remainingWords.slice(wordIndex + 1)];

        // 尝试横向和纵向放置
        const directions = ['across', 'down'];
        for (const direction of directions) {
            // 寻找所有可能的放置位置，优先考虑有交叉点的位置
            const possiblePositions = findPossiblePositions(currentGrid, word.text, direction);

            // 打乱位置顺序增加随机性
            const shuffledPositions = [...possiblePositions].sort(() => Math.random() - 0.5);

            for (const { row, col } of shuffledPositions) {
                // 检查是否可以放置单词
                if (canPlaceWord(currentGrid, word.text, row, col, direction)) {
                    // 创建网格副本
                    // 使用结构化克隆优化网格复制性能
                    const newGrid = structuredClone(currentGrid);
                    // 放置单词
                    const positions = placeWord(newGrid, word.text, row, col, direction, currentNum);
                    const newWordPositions = { ...wordPositions };
                    newWordPositions[currentNum] = positions;
                    // 记录线索
                    const newAcross = [...currentAcross];
                    const newDown = [...currentDown];
                    if (direction === 'across') {
                        newAcross.push({ number: currentNum, obj: word.obj });
                    } else {
                        newDown.push({ number: currentNum, obj: word.obj });
                    }

                    // 递归继续放置下一个单词
                    const result = backtrack(newRemaining, newGrid, newAcross, newDown, currentNum + 1, newWordPositions);
                    if (result.success) {
                        return result;
                    }
                }
            }
        }

        // 如果无法放置当前单词，尝试剩余单词
        for (let i = 0; i < newRemaining.length; i++) {
            const result = backtrack([...newRemaining.slice(0, i), ...newRemaining.slice(i + 1)], currentGrid, currentAcross, currentDown, currentNum, wordPositions);
            if (result.success) return result;
        }
        return { success: false };
    }

    // 寻找可能的放置位置
    function findPossiblePositions(grid, word, direction) {
        const positions = [];
        const height = grid.length;
        const width = grid[0].length;
        const wordLength = word.length;

        // 如果网格为空，随机放置第一个单词
        if (isGridEmpty(grid)) {
            if (direction === 'across') {
                const row = Math.floor(Math.random() * height);
                const col = Math.floor(Math.random() * (width - wordLength));
                return [{ row, col }];
            } else {
                const row = Math.floor(Math.random() * (height - wordLength));
                const col = Math.floor(Math.random() * width);
                return [{ row, col }];
            }
        }

        // 寻找与现有单词的交叉点
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                const cell = grid[r][c];
                if (cell !== 'black' && typeof cell === 'object' && cell.answer) {
                    // 检查这个字符是否在当前单词中
                    for (let i = 0; i < wordLength; i++) {
                        if (word[i] === cell.answer) {
                            // 计算可能的放置位置
                            if (direction === 'across') {
                                const newRow = r;
                                const newCol = c - i;
                                if (newCol >= 0 && newCol + wordLength <= width) {
                                    positions.push({ row: newRow, col: newCol });
                                }
                            } else {
                                const newRow = r - i;
                                const newCol = c;
                                if (newRow >= 0 && newRow + wordLength <= height) {
                                    positions.push({ row: newRow, col: newCol });
                                }
                            }
                        }
                    }
                }
            }
        }

        // 如果没有交叉点，添加一些随机位置作为备选
        if (positions.length === 0) {
            for (let i = 0; i < 5; i++) {
                if (direction === 'across') {
                    const row = Math.floor(Math.random() * height);
                    const col = Math.floor(Math.random() * (width - wordLength));
                    positions.push({ row, col });
                } else {
                    const row = Math.floor(Math.random() * (height - wordLength));
                    const col = Math.floor(Math.random() * width);
                    positions.push({ row, col });
                }
            }
        }

        return positions;
    }

    // 检查网格是否为空
    function isGridEmpty(grid) {
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c] !== 'black') {
                    return false;
                }
            }
        }
        return true;
    }

    // 开始回溯算法
    const result = backtrack(allWords, grid, acrossClues, downClues, currentNumber, {});

    // 如果回溯成功，使用结果；否则使用默认单词
    if (result.success) {
        grid = result.grid;
        acrossClues = result.acrossClues;
        downClues = result.downClues;
        wordPositions = result.wordPositions;
    } else {
        console.warn('无法放置所有单词，使用部分结果');
        // 当回溯失败时，尝试减少单词数量重新生成
        if (maxCnt > 3) {
            const reducedMaxCnt = Math.floor(maxCnt * 0.8);
            return generatePuzzleData(birds, width, height, reducedMaxCnt);
        }
    }


    return { width, height, grid, acrossClues, downClues, wordPositions: wordPositions || {} };
}

// 检查单词是否可以放置
function canPlaceWord(grid, word, row, col, direction) {
    const height = grid.length;
    const width = grid[0].length;

    for (let i = 0; i < word.length; i++) {
        const r = direction === 'across' ? row : row + i;
        const c = direction === 'across' ? col + i : col;

        // 增加边界检查，防止访问负数索引
        if (r < 0 || r >= height || c < 0 || c >= width) return false;
        // 检查行是否存在
        if (!grid[r]) return false;
        const cell = grid[r][c];
        // 检查cell是否为undefined
        if (cell === undefined) return false;
        if (cell !== 'black') {
            // 确保单元格是有效的对象且包含answer属性
            if (typeof cell !== 'object' || cell === null || !('answer' in cell) || cell.answer === undefined || cell.answer !== word[i]) {
                return false;
            }
        }
    }
    return true;
}

// 放置单词到网格
function placeWord(grid, word, row, col, direction, number) {
    const positions = [];
    for (let i = 0; i < word.length; i++) {
        const r = direction === 'across' ? row : row + i;
        const c = direction === 'across' ? col + i : col;

        grid[r][c] = i === 0 ?
            { number, answer: word[i] } :
            { answer: word[i] };
        positions.push([r, c]);
    }
    return positions;
}
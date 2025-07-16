// 生成填字游戏数据
export function generatePuzzleData(birds) {
    console.info(birds)
    // 创建10x10的网格
    const width = 10;
    const height = 10;
    const grid = Array(height).fill().map(() => Array(width).fill('black'));
    const acrossClues = [];
    const downClues = [];
    let currentNumber = 1;

    // 放置横向单词
    const acrossWords = birds.slice(0, 4).map(bird => ({
        text: bird.name,
        clue: `国家${bird.protection.国家重点保护动物}级保护鸟类: ${bird.name}`
    }));

    // 放置纵向单词
    const downWords = birds.slice(4, 8).map(bird => ({
        text: bird.name,
        clue: `IUCN红色名录${bird.protection.IUCN红色名录}: ${bird.name}`
    }));

    // 简单布局算法：交错放置横向和纵向单词以避免重叠
    acrossWords.forEach((word, index) => {
        const row = index * 2;
        const col = Math.floor(Math.random() * (width - word.length));
        if (canPlaceWord(grid, word.text, row, col, 'across')) {
            placeWord(grid, word.text, row, col, 'across', currentNumber);
            acrossClues.push({ number: currentNumber, text: word.clue });
            currentNumber++;
        }
    });

    downWords.forEach((word, index) => {
        const row = Math.floor(Math.random() * (height - word.length));
        const col = index * 2 + 1;
        if (canPlaceWord(grid, word.text, row, col, 'down')) {
            placeWord(grid, word.text, row, col, 'down', currentNumber);
            downClues.push({ number: currentNumber, text: word.clue });
            currentNumber++;
        }
    });

    // 确保至少有一些单词被放置
    if (acrossClues.length === 0 && downClues.length === 0) {
        // 如果没有单词可以放置，使用默认单词
        grid[0][0] = { number: 1, answer: '鸟' };
        grid[0][1] = { answer: '类' };
        acrossClues.push({ number: 1, text: '动物类别' });
        downClues.push({ number: 1, text: '有羽毛的动物' });
    }
    return { width, height, grid, acrossClues, downClues };
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
    for (let i = 0; i < word.length; i++) {
        const r = direction === 'across' ? row : row + i;
        const c = direction === 'across' ? col + i : col;

        grid[r][c] = i === 0 ?
            { number, answer: word[i] } :
            { answer: word[i] };
    }
}
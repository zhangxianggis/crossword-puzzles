const xlsx = require('xlsx');
const fs = require('fs');

// 读取 Excel 文件
const workbook = xlsx.readFile('cdBirdsV4.0.xlsx');
// 获取工作表名称
const sheetName = workbook.SheetNames[0];
// 将工作表转换为 JSON 对象
let data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

// 转换数据格式，跳过中文名为空的行
const formattedData = data.filter(item => item['中文名']).map(item => ({
    name: item['中文名'],
    scientificName: item['种名'],
    protection: {
        "国家重点保护动物": item['国家重点保护动物'] || '无',
        "IUCN红色名录": item['IUCN红色名录'] || '无',
        "中国生物多样性红色名录": item['中国生物多样性红色名录'] || '无'
    }
}));

// 将结果写入新的 JSON 文件
fs.writeFile('birdsData.json', JSON.stringify(formattedData, null, 2), (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
});
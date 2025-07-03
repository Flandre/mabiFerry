// 调试开关
let DEBUG_MODE = true;

// 中文本地化
const I18N = {
    'Port Sella': '塞拉港口(巨人港)',
    'Port Connous': '肯努斯港口(精灵港)', 
    'Port Ceann': '凯安港口',
    'Port Cobh': '卡普港口',
    'Port Qilla': '克拉港口',
    'Belvast Island': '贝尔法斯特',
    'Destination': '目的地',
    'ETD': '预计离港时间',
    'ETA': '预计到达时间',
    'status': '状态',
    'WAIT': '等候',
    'CHECK IN': '检票中'
};

// 轮渡路线配置 - 所有伊利亚港口timeOffset减去60，恢复以"卡普→克拉"为基准
const Ferry = [
    {
        from: 'Port Sella',
        to: 'Port Ceann',
        baseTime: 'Iria',
        timeOffset: 0,  // 60 - 60 = 0
    },
    {
        from: 'Port Connous',
        to: 'Port Ceann',
        baseTime: 'Iria',
        timeOffset: 0,  // 60 - 60 = 0
    },
    {
        from: 'Port Ceann',
        to: 'Port Sella',
        baseTime: 'Iria',
        timeOffset: -60,  // 相对于塞拉→凯安基准的偏移
    },
    {
        from: 'Port Ceann',
        to: 'Port Connous',
        baseTime: 'Iria',
        timeOffset: -30,  // 30 - 60 = -30
    },
    {
        from: 'Port Cobh',
        to: 'Port Qilla',
        baseTime: 'Iria',
        timeOffset: -60,  // 0 - 60 = -60，重新成为基准参考
        checkTicket: true
    },
    {
        from: 'Port Qilla',
        to: 'Port Cobh',
        baseTime: 'Iria',
        timeOffset: -30,  // 30 - 60 = -30
    },
    {
        from: 'Port Cobh',
        to: 'Belvast Island',
        baseTime: 'Belvast',
        timeOffset: 0,  // 贝尔法斯特路线不变
        checkTicket: true
    },
    {
        from: 'Belvast Island',
        to: 'Port Cobh',
        baseTime: 'Belvast',
        timeOffset: 30,  // 贝尔法斯特路线不变
    }
];

// 基础时间配置
let BaseTime = {
    Irusan: {
        base: {
            Iria: {
                timeStr: null,
                interval: [5*60*1000, 6*60*1000, 4*60*1000], // 等候时间，检票时间，航行时间
            },
            Belvast: {
                timeStr: null,
                interval: [(2*60+30)*1000, (3*60+30)*1000, 2*60*1000]
            }
        },
        channelOffset: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
};

// 数据保存和恢复功能
const DataManager = {
    STORAGE_KEY: 'ferry_timetable_data',
    
    saveData() {
        try {
            const data = {
                iriaData: this.collectIriaData(),
                belvastData: this.collectBelvastData(),
                currentChannel: document.getElementById('current-channel')?.value || '9',
                version: '1.0'
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    },
    
    loadData() {
        try {
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            if (!savedData) return false;
            
            const data = JSON.parse(savedData);
            
            if (data.iriaData) {
                this.restoreIriaData(data.iriaData);
            }
            
            if (data.belvastData) {
                this.restoreBelvastData(data.belvastData);
            }
            
            if (data.currentChannel) {
                const channelSelect = document.getElementById('current-channel');
                if (channelSelect) {
                    channelSelect.value = data.currentChannel;
                }
            }
            
            return true;
        } catch (error) {
            console.error('加载数据失败:', error);
            return false;
        }
    },
    
    collectIriaData() {
        const data = [];
        const rows = document.querySelectorAll('#iria-data .data-row');
        rows.forEach((row, index) => {
            const statusSelect = row.querySelector('.status-select');
            const currentTimeInput = row.querySelector('.current-time');
            const displayTimeInput = row.querySelector('.display-time');
            
            if (statusSelect && currentTimeInput && displayTimeInput) {
                data.push({
                    line: index + 1,
                    status: statusSelect.value,
                    currentTime: currentTimeInput.value,
                    displayTime: displayTimeInput.value
                });
            }
        });
        return data;
    },
    
    collectBelvastData() {
        const data = [];
        const rows = document.querySelectorAll('#belvast-data .data-row');
        rows.forEach((row) => {
            const statusSelect = row.querySelector('.status-select');
            const currentTimeInput = row.querySelector('.current-time');
            const displayTimeInput = row.querySelector('.display-time');
            
            if (statusSelect && currentTimeInput && displayTimeInput) {
                data.push({
                    status: statusSelect.value,
                    currentTime: currentTimeInput.value,
                    displayTime: displayTimeInput.value
                });
            }
        });
        return data;
    },
    
    restoreIriaData(data) {
        const rows = document.querySelectorAll('#iria-data .data-row');
        data.forEach((item, index) => {
            if (index < rows.length) {
                const row = rows[index];
                const statusSelect = row.querySelector('.status-select');
                const currentTimeInput = row.querySelector('.current-time');
                const displayTimeInput = row.querySelector('.display-time');
                
                if (statusSelect && item.status) statusSelect.value = item.status;
                if (currentTimeInput && item.currentTime) currentTimeInput.value = item.currentTime;
                if (displayTimeInput && item.displayTime) displayTimeInput.value = item.displayTime;
            }
        });
    },
    
    restoreBelvastData(data) {
        const rows = document.querySelectorAll('#belvast-data .data-row');
        data.forEach((item, index) => {
            if (index < rows.length) {
                const row = rows[index];
                const statusSelect = row.querySelector('.status-select');
                const currentTimeInput = row.querySelector('.current-time');
                const displayTimeInput = row.querySelector('.display-time');
                
                if (statusSelect && item.status) statusSelect.value = item.status;
                if (currentTimeInput && item.currentTime) currentTimeInput.value = item.currentTime;
                if (displayTimeInput && item.displayTime) displayTimeInput.value = item.displayTime;
            }
        });
    },
    
    exportData() {
        try {
            const data = {
                iriaData: this.collectIriaData(),
                belvastData: this.collectBelvastData(),
                currentChannel: document.getElementById('current-channel')?.value || '9',
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ferry_timetable_data_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('导出数据失败:', error);
            return false;
        }
    },
    
    importData(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('未选择文件'));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (!data.iriaData && !data.belvastData) {
                        throw new Error('无效的数据格式');
                    }
                    
                    if (data.iriaData) {
                        this.restoreIriaData(data.iriaData);
                    }
                    
                    if (data.belvastData) {
                        this.restoreBelvastData(data.belvastData);
                    }
                    
                    if (data.currentChannel) {
                        const channelSelect = document.getElementById('current-channel');
                        if (channelSelect) {
                            channelSelect.value = data.currentChannel;
                        }
                    }
                    
                    this.saveData();
                    // 重置调试输出标记
                    debugOutputShown = false;
                    calculateBaseTimeFromData();
                    renderTimetable();
                    
                    resolve(true);
                } catch (error) {
                    console.error('导入数据失败:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsText(file);
        });
    },
    
    clearData() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            this.resetToDefault();
            return true;
        } catch (error) {
            console.error('清除数据失败:', error);
            return false;
        }
    },
    
    resetToDefault() {
        const now = new Date();
        const currentTimeStr = now.toISOString().slice(0, 19);
        
        const defaultIriaData = [
            { status: '2', currentTime: '2025-07-02 17:55:27', displayTime: '4:32' },
            { status: '2', currentTime: '2025-07-02 17:55:08', displayTime: '5:05' },
            { status: '2', currentTime: '2025-07-02 17:54:46', displayTime: '5:17' },
            { status: '2', currentTime: '2025-07-02 17:54:25', displayTime: '5:52' },
            { status: '1', currentTime: '2025-07-02 17:54:04', displayTime: '0:13' },
            { status: '1', currentTime: '2025-07-02 17:53:48', displayTime: '0:27' },
            { status: '1', currentTime: '2025-07-02 17:53:32', displayTime: '2:13' },
            { status: '1', currentTime: '2025-07-02 17:53:17', displayTime: '1:02' },
            { status: '1', currentTime: '2025-07-02 17:52:58', displayTime: '1:19' },
            { status: '1', currentTime: '2025-07-02 17:52:06', displayTime: '2:10' }
        ];
        
        const defaultBelvastData = [
            { status: '2', currentTime: '2025-07-03 08:23:59', displayTime: '1:46' }
        ];
        
        this.restoreIriaData(defaultIriaData);
        this.restoreBelvastData(defaultBelvastData);
        
        const channelSelect = document.getElementById('current-channel');
        if (channelSelect) {
            channelSelect.value = '9';
        }
        
        // 重置调试输出标记
        debugOutputShown = false;
        calculateBaseTimeFromData();
        renderTimetable();
    }
};

// 工具函数
const AddZero = num => num < 10 ? `0${num}` : num;

const RenderTime = ts => {
    let d = new Date(ts);
    return `${AddZero(d.getHours())}:${AddZero(d.getMinutes())}:${AddZero(d.getSeconds())}`;
};

const RenderCountDown = ts => `${Math.floor(ts / 1000 / 60)}:${AddZero(Math.floor(ts / 1000) % 60)}`;

const parseDisplayTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
};

// 时区安全的时间转换函数
const parseTimeStringAsLocal = (timeStr) => {
    // 将ISO格式的时间字符串作为本地时间解析，避免时区转换
    if (!timeStr || typeof timeStr !== 'string') return Date.now();
    
    // 检查是否是完整的ISO格式
    if (timeStr.length === 19) { // YYYY-MM-DDTHH:mm:ss
        const parts = timeStr.split('T');
        if (parts.length === 2) {
            const datePart = parts[0]; // YYYY-MM-DD
            const timePart = parts[1]; // HH:mm:ss
            
            const dateComponents = datePart.split('-');
            const timeComponents = timePart.split(':');
            
            if (dateComponents.length === 3 && timeComponents.length === 3) {
                // 使用本地时间构造Date对象，避免时区转换
                const year = parseInt(dateComponents[0]);
                const month = parseInt(dateComponents[1]) - 1; // 月份从0开始
                const day = parseInt(dateComponents[2]);
                const hour = parseInt(timeComponents[0]);
                const minute = parseInt(timeComponents[1]);
                const second = parseInt(timeComponents[2]);
                
                return new Date(year, month, day, hour, minute, second).getTime();
            }
        }
    }
    
    // 如果格式不匹配，尝试直接解析
    return new Date(timeStr).getTime();
};

// 将时间戳转换为本地ISO格式字符串
const formatTimeAsLocalISO = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
};

// 添加调试输出标记
let debugOutputShown = false;

// 重新设计的到港时间计算函数
const createTimeInfo = (status, currentTimeStr, displayTimeStr, isIriaData = true) => {
    const currentTime = parseTimeStringAsLocal(currentTimeStr);
    const displaySeconds = parseDisplayTime(displayTimeStr);
    
    // 根据数据类型选择正确的时间间隔
    let waitTime, checkInTime;
    if (isIriaData) {
        // 伊利亚时间间隔：等候5分钟，检票6分钟
        waitTime = 5 * 60;
        checkInTime = 6 * 60;
    } else {
        // 贝尔法斯特时间间隔：等候2分30秒，检票3分30秒
        waitTime = 2.5 * 60;
        checkInTime = 3.5 * 60;
    }
    
    let arrivalTime;
    
    if (status === 1) {
        // 等候中：displayTime是距离到港的剩余时间
        arrivalTime = currentTime + displaySeconds * 1000;
    } else if (status === 2) {
        // 检票中：displayTime是距离离港的剩余时间
        // 到港时间 = 当前时间 - (检票时间 - 剩余检票时间)
        const elapsedCheckInTime = checkInTime - displaySeconds;
        arrivalTime = currentTime - elapsedCheckInTime * 1000;
    } else {
        arrivalTime = currentTime;
    }
    
    return arrivalTime;
};

const setCurrentTime = () => {
    const now = new Date();
    const timeString = formatTimeAsLocalISO(now.getTime());
    
    const timeInputs = document.querySelectorAll('.current-time');
    timeInputs.forEach(input => {
        if (!input.value) {
            input.value = timeString;
        }
    });
};

// 从输入数据计算基础时间和偏移
const calculateBaseTimeFromData = () => {
    try {
        // 清除之前的调试标记
        if (FindCurrentTimes._debugShown) {
            FindCurrentTimes._debugShown.clear();
        }
        
        // 收集伊利亚数据
        const iriaData = [];
        const iriaRows = document.querySelectorAll('#iria-data .data-row');
        
        iriaRows.forEach((row, index) => {
            const statusSelect = row.querySelector('.status-select');
            const currentTimeInput = row.querySelector('.current-time');
            const displayTimeInput = row.querySelector('.display-time');
            
            if (statusSelect && currentTimeInput && displayTimeInput) {
                const status = parseInt(statusSelect.value);
                const currentTime = currentTimeInput.value;
                const displayTime = displayTimeInput.value;
                
                if (currentTime && displayTime) {
                    iriaData.push({
                        line: index + 1,
                        status: status,
                        currentTime: currentTime,
                        displayTime: displayTime,
                        arrivalTime: createTimeInfo(status, currentTime, displayTime, true)
                    });
                }
            }
        });

        // 收集贝尔法斯特数据
        const belvastData = [];
        const belvastRows = document.querySelectorAll('#belvast-data .data-row');
        
        belvastRows.forEach((row) => {
            const statusSelect = row.querySelector('.status-select');
            const currentTimeInput = row.querySelector('.current-time');
            const displayTimeInput = row.querySelector('.display-time');
            
            if (statusSelect && currentTimeInput && displayTimeInput) {
                const status = parseInt(statusSelect.value);
                const currentTime = currentTimeInput.value;
                const displayTime = displayTimeInput.value;
                
                if (currentTime && displayTime) {
                    belvastData.push({
                        status: status,
                        currentTime: currentTime,
                        displayTime: displayTime,
                        arrivalTime: createTimeInfo(status, currentTime, displayTime, false)
                    });
                }
            }
        });

        // 计算伊利亚基础时间和偏移
        if (iriaData.length >= 1) {
            // 以第10线（索引9）为基准，如果没有第10线数据则使用第一个可用数据
            const referenceIndex = iriaData.length >= 10 ? 9 : 0;
            const referenceData = iriaData[referenceIndex];
            const baseTime = referenceData.arrivalTime;
            
            // 只输出一次调试信息
            if (DEBUG_MODE && !debugOutputShown) {
                console.log('=== 轮渡时刻表数据计算 ===');
                console.log('\n--- 录入数据 ---');
                iriaData.forEach(data => {
                    console.log(`第${data.line}线: ${data.status === 1 ? '等候' : '检票'} | 观察时间: ${new Date(parseTimeStringAsLocal(data.currentTime)).toLocaleString('zh-CN')} | 显示: ${data.displayTime} | 计算到港: ${new Date(data.arrivalTime).toLocaleString('zh-CN')}`);
                });
                
                console.log(`\n--- 基准数据 ---`);
                console.log(`基准线路: 第${referenceData.line}线`);
                console.log(`基准状态: ${referenceData.status === 1 ? '等候' : '检票中'}`);
                console.log(`基准时间: ${new Date(baseTime).toLocaleString('zh-CN')}`);
                
                debugOutputShown = true;
            }
            
            // 设置基础时间
            BaseTime.Irusan.base.Iria.timeStr = formatTimeAsLocalISO(baseTime);
            
            // 计算其他线路的偏移量
            const loopTime = (5 + 6) * 60 * 1000; // 11分钟周期（毫秒）
            const halfLoop = loopTime / 2; // 半个周期
            
            // 初始化偏移数组
            const channelOffset = new Array(10).fill(0);
            
            iriaData.forEach((data, index) => {
                if (index === referenceIndex) {
                    channelOffset[index] = 0; // 基准线路偏移为0
                    return;
                }
                
                // 计算原始偏移
                let offsetMs = data.arrivalTime - baseTime;
                
                // 调整偏移到半个周期内
                while (offsetMs > halfLoop) {
                    offsetMs -= loopTime;
                }
                while (offsetMs < -halfLoop) {
                    offsetMs += loopTime;
                }
                
                channelOffset[index] = Math.floor(offsetMs / 1000); // 转换为秒
            });
            
            // 只输出一次偏移量信息
            if (DEBUG_MODE && debugOutputShown) {
                console.log('\n--- 偏移量计算 ---');
                channelOffset.forEach((offset, index) => {
                    if (iriaData[index]) {
                        const offsetStr = offset === 0 ? '基准' : (offset < 0 ? '-' : '+') + Math.abs(offset) + 's';
                        console.log(`第${index + 1}线偏移: ${offsetStr}`);
                    }
                });
                console.log('=== 计算完成 ===\n');
            }
            
            BaseTime.Irusan.channelOffset = channelOffset;
            
            // 显示计算的基础时间
            const calculatedIriaElement = document.getElementById('calculated-iria-time');
            if (calculatedIriaElement) {
                calculatedIriaElement.textContent = new Date(parseTimeStringAsLocal(BaseTime.Irusan.base.Iria.timeStr)).toLocaleString('zh-CN') + ` (基于第${referenceData.line}线)`;
            }
            
        } else {
            BaseTime.Irusan.base.Iria.timeStr = null;
            BaseTime.Irusan.channelOffset = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            const calculatedIriaElement = document.getElementById('calculated-iria-time');
            if (calculatedIriaElement) {
                calculatedIriaElement.textContent = '需要输入观察数据';
            }
        }

        // 计算贝尔法斯特基础时间
        if (belvastData.length > 0) {
            const baseTime = belvastData[0].arrivalTime;
            BaseTime.Irusan.base.Belvast.timeStr = formatTimeAsLocalISO(baseTime);
            
            const calculatedBelvastElement = document.getElementById('calculated-belvast-time');
            if (calculatedBelvastElement) {
                calculatedBelvastElement.textContent = new Date(parseTimeStringAsLocal(BaseTime.Irusan.base.Belvast.timeStr)).toLocaleString('zh-CN');
            }
        } else {
            BaseTime.Irusan.base.Belvast.timeStr = null;
            const calculatedBelvastElement = document.getElementById('calculated-belvast-time');
            if (calculatedBelvastElement) {
                calculatedBelvastElement.textContent = '需要输入观察数据';
            }
        }

        // 运行验证测试（仅在调试模式下且首次运行时）
        if (DEBUG_MODE && debugOutputShown) {
            runIndependentTest();
            validateTimeCalculation();
        }

    } catch (error) {
        console.error('计算基础时间时出错:', error);
        const calculatedIriaElement = document.getElementById('calculated-iria-time');
        const calculatedBelvastElement = document.getElementById('calculated-belvast-time');
        if (calculatedIriaElement) {
            calculatedIriaElement.textContent = '计算出错: ' + error.message;
        }
        if (calculatedBelvastElement) {
            calculatedBelvastElement.textContent = '计算出错: ' + error.message;
        }
    }
};

// 查找当前时间
const FindCurrentTimes = (now, baseTimeId, timeOffset, server = 'Irusan', channel = 9, count = 3) => {
    let { timeStr, interval } = BaseTime[server].base[baseTimeId];
    
    if (!timeStr) {
        if (!FindCurrentTimes._warningShown) {
            FindCurrentTimes._warningShown = true;
            console.warn(`基础时间未设置，无法计算时刻表。请输入观察数据。`);
        }
        return [];
    }
    
    FindCurrentTimes._warningShown = false;
    
    let base = parseTimeStringAsLocal(timeStr);
    let channelOffset = (BaseTime[server].channelOffset[channel] || 0) * 1000;
    
    let baseArrivalTime = base + channelOffset;
    let loopTime = interval[0] + interval[1];
    let adjustedArrivalTime = baseArrivalTime + timeOffset * 1000;
    let currentCycleArrival = adjustedArrivalTime + Math.floor((now - adjustedArrivalTime) / loopTime) * loopTime;
    
    let out = [];
    let currentTime = currentCycleArrival;
    
    for(let i = 0; i < count; i++) {
        out.push([
            currentTime - interval[0],
            currentTime,
            currentTime + interval[1],
            currentTime + interval[1] + interval[2]
        ]);
        
        currentTime += loopTime;
    }
    
    return out;
};

// 检查状态
const checkStatus = (times, targetTs) => {
    for(let i = 0; i < times.length; i++) {
        let targetGroup = times[i];
        
        if(targetTs >= targetGroup[1] && targetTs < targetGroup[2]){
            return {
                group: i,
                target: 1,
                timeOffset: targetGroup[2] - targetTs
            };
        }
        if(targetTs >= targetGroup[0] && targetTs < targetGroup[1]){
            return {
                group: i,
                target: 0,
                timeOffset: targetGroup[1] - targetTs
            };
        }
    }
    
    return {
        group: -1,
        target: -1,
        timeOffset: 0
    };
};

// 生成时刻表数据
const generateTimetableData = (channel) => {
    const now = Date.now();
    const server = 'Irusan';
    
    // 检查是否有有效的基础时间数据
    const hasIriaData = BaseTime[server].base.Iria.timeStr !== null;
    const hasBelvastData = BaseTime[server].base.Belvast.timeStr !== null;
    
    if (!hasIriaData && !hasBelvastData) {
        return [];
    }
    
    // 获取所有港口
    const ports = Array.from(new Set(Ferry.map(x => x.from)));
    
    return ports.map(port => {
        return {
            label: port,
            arrival: Ferry.filter(x => x.from == port).map(routing => {
                // 检查当前路线需要的基础时间是否可用
                const needsIria = routing.baseTime === 'Iria';
                const needsBelvast = routing.baseTime === 'Belvast';
                
                if ((needsIria && !hasIriaData) || (needsBelvast && !hasBelvastData)) {
                    // 如果需要的基础时间不可用，返回空的时间数据
                    return {
                        to: routing.to,
                        times: [],
                        status: { group: -1, target: -1, timeOffset: 0 },
                        dataUnavailable: true
                    };
                }
                
                let times = FindCurrentTimes(now, routing.baseTime, routing.timeOffset, server, channel, 3);
                return {
                    to: routing.to,
                    times,
                    status: times.length > 0 ? checkStatus(times, now) : { group: -1, target: -1, timeOffset: 0 },
                    dataUnavailable: false
                };
            })
        };
    });
};

// 渲染频道偏移显示
const renderChannelOffsetDisplay = (currentChannel) => {
    const target = BaseTime.Irusan.channelOffset[currentChannel] || 0;
    const offsets = BaseTime.Irusan.channelOffset.map(x => x - target);
    
    return `
        <div class="channel-offset-display">
            <h3>频道偏移时间（点击切换基准频道）</h3>
            <div class="offset-list">
                ${offsets.map((offset, index) => `
                    <span class="offset-status ${offset == 0 ? 'active' : offset < 0 ? 'early' : 'late'}" 
                          data-channel="${index}" 
                          onclick="switchChannel(${index})"
                          title="点击切换到${index + 1}频道">
                        ${index + 1}频道: ${offset == 0 ? '基准' : (offset < 0 ? '-' : '+') + RenderCountDown(Math.abs(offset * 1000))}
                    </span>
                `).join('')}
            </div>
        </div>
    `;
};

// 切换频道函数
const switchChannel = (channelIndex) => {
    const channelSelect = document.getElementById('current-channel');
    if (channelSelect) {
        channelSelect.value = channelIndex;
        
        // 触发change事件以保存数据和重新渲染
        const changeEvent = new Event('change', { bubbles: true });
        channelSelect.dispatchEvent(changeEvent);
        
        // 立即重新渲染时刻表
        renderTimetable();
        
        // 显示切换提示
        showDataStatus(`已切换到${channelIndex + 1}频道`, 'info');
    }
};

// 渲染时刻表
const renderTimetable = () => {
    const currentChannel = parseInt(document.getElementById('current-channel').value);
    const timetableData = generateTimetableData(currentChannel);
    const now = new Date();
    
    if (DEBUG_MODE) {
        console.log('=== 渲染时刻表调试 ===');
        console.log('当前时间:', now.toLocaleString('zh-CN'));
        console.log('当前时间戳:', now.getTime());
    }
    
    // 更新时间显示
    const updateTimeElement = document.getElementById('update-time');
    if (updateTimeElement) {
        updateTimeElement.textContent = now.toLocaleString('zh-CN');
    }
    
    // 将港口数据分成两列
    const leftPorts = [];
    const rightPorts = [];
    
    timetableData.forEach((port, index) => {
        if (index % 2 === 0) {
            leftPorts.push(port);
        } else {
            rightPorts.push(port);
        }
    });
    
    // 生成单个港口的HTML
    const renderPortGroup = (port) => `
        <div class="port-group">
            <div class="port-label">${I18N[port.label] || port.label}</div>
            <div class="time-table-container">
                <div class="time-table-header">
                    <div class="time-table-col time-table-col-1">${I18N['Destination']}</div>
                    <div class="time-table-col time-table-col-2">${I18N['ETD']}</div>
                    <div class="time-table-col time-table-col-3">${I18N['ETA']}</div>
                    <div class="time-table-col time-table-col-4">${I18N['status']}</div>
                </div>
                ${port.arrival.map(arrival => {
                    if (arrival.dataUnavailable) {
                        // 数据不可用时显示提示
                        return `
                            <div class="time-table-row">
                                <div class="time-table-col time-table-col-1">${I18N[arrival.to] || arrival.to}</div>
                                <div class="time-table-col time-table-col-2">--:--:--</div>
                                <div class="time-table-col time-table-col-3">--:--:--</div>
                                <div class="time-table-col time-table-col-4">
                                    <span style="color: #ff6b6b;">需要观察数据</span>
                                </div>
                            </div>
                        `;
                    }
                    
                    if (arrival.times.length === 0) {
                        // 没有时间数据时显示提示
                        return `
                            <div class="time-table-row">
                                <div class="time-table-col time-table-col-1">${I18N[arrival.to] || arrival.to}</div>
                                <div class="time-table-col time-table-col-2">--:--:--</div>
                                <div class="time-table-col time-table-col-3">--:--:--</div>
                                <div class="time-table-col time-table-col-4">
                                    <span style="color: #ff6b6b;">计算中...</span>
                                </div>
                            </div>
                        `;
                    }
                    
                    // 正常显示时间数据
                    return arrival.times.map((time, index) => `
                        <div class="time-table-row">
                            <div class="time-table-col time-table-col-1">${I18N[arrival.to] || arrival.to}</div>
                            <div class="time-table-col time-table-col-2">${RenderTime(time[2])}</div>
                            <div class="time-table-col time-table-col-3">${RenderTime(time[3])}</div>
                            <div class="time-table-col time-table-col-4">
                                ${arrival.status.group == index ? `
                                    <span class="status ${arrival.status.target == 0 ? 'wait' : 'check-in'}">
                                        ${arrival.status.target == 0 ? I18N['WAIT'] : I18N['CHECK IN']}
                                    </span>
                                    (${RenderCountDown(arrival.status.timeOffset)})
                                ` : ''}
                            </div>
                        </div>
                    `).join('');
                }).join('')}
            </div>
        </div>
    `;
    
    // 生成完整HTML
    const html = `
        ${renderChannelOffsetDisplay(currentChannel)}
        <div class="ports-grid">
            <div class="ports-column-left">
                ${leftPorts.map(port => renderPortGroup(port)).join('')}
            </div>
            <div class="ports-column-right">
                ${rightPorts.map(port => renderPortGroup(port)).join('')}
            </div>
        </div>
    `;
    
    const timetableContentElement = document.getElementById('timetable-content');
    if (timetableContentElement) {
        timetableContentElement.innerHTML = html;
    }
};

// 添加所有输入框的事件监听器
const addInputListeners = () => {
    // 监听所有数据输入的变化
    const allInputs = document.querySelectorAll('.status-select, .current-time, .display-time');
    allInputs.forEach(input => {
        input.addEventListener('change', () => {
            // 重置调试输出标记，允许输出新的调试信息
            debugOutputShown = false;
            calculateBaseTimeFromData();
            renderTimetable();
        });
        input.addEventListener('input', () => {
            // 重置调试输出标记，允许输出新的调试信息
            debugOutputShown = false;
            calculateBaseTimeFromData();
            renderTimetable();
        });
    });

    // 监听线路选择变化
    const currentChannelElement = document.getElementById('current-channel');
    if (currentChannelElement) {
        currentChannelElement.addEventListener('change', () => {
            DataManager.saveData(); // 保存线路选择
            renderTimetable();
        });
    }
};

// 重新校准基础时间（避免长期运行的累积误差）
const recalibrateBaseTime = () => {
    if (DEBUG_MODE) console.log('开始重新校准基础时间...');
    
    // 收集当前输入的数据
    const iriaData = DataManager.collectIriaData();
    const belvastData = DataManager.collectBelvastData();
    
    if (iriaData.length === 0 && belvastData.length === 0) {
        showDataStatus('没有可用的校准数据！', 'error');
        return false;
    }
    
    try {
        // 重置调试输出标记
        debugOutputShown = false;
        // 重新计算基础时间
        calculateBaseTimeFromData();
        showDataStatus('基础时间校准完成！', 'success');
        if (DEBUG_MODE) console.log('基础时间校准完成');
        return true;
    } catch (error) {
        console.error('校准基础时间时出错:', error);
        showDataStatus('校准失败: ' + error.message, 'error');
        return false;
    }
};

// 创建数据管理按钮
const createDataManagementButtons = () => {
    const controlPanel = document.querySelector('.control-panel');
    if (!controlPanel) return;
    
    const buttonSection = document.createElement('div');
    buttonSection.className = 'data-management-section';
    buttonSection.innerHTML = `
        <h3>数据管理</h3>
        <div class="data-buttons">
            <button id="export-btn" class="data-btn export-btn">导出数据</button>
            <button id="import-btn" class="data-btn import-btn">导入数据</button>
            <button id="clear-btn" class="data-btn clear-btn">清除数据</button>
            <button id="reset-btn" class="data-btn reset-btn">重置默认</button>
            <button id="set-current-time-btn" class="data-btn reset-btn">设置当前时间</button>
            <button id="recalibrate-btn" class="data-btn recalibrate-btn">重新校准时间</button>
            <button id="debug-toggle-btn" class="data-btn debug-btn">${DEBUG_MODE ? '关闭调试' : '开启调试'}</button>
            <button id="run-test-btn" class="data-btn debug-btn">运行测试</button>
        </div>
        <input type="file" id="import-file" accept=".json" style="display: none;">
        <div id="data-status" class="data-status"></div>
    `;
    
    controlPanel.appendChild(buttonSection);
    
    // 添加按钮事件监听器
    document.getElementById('export-btn').addEventListener('click', () => {
        if (DataManager.exportData()) {
            showDataStatus('数据导出成功！', 'success');
        } else {
            showDataStatus('数据导出失败！', 'error');
        }
    });
    
    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    
    document.getElementById('import-file').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                await DataManager.importData(file);
                showDataStatus('数据导入成功！', 'success');
                e.target.value = ''; // 清除文件选择
            } catch (error) {
                showDataStatus('数据导入失败: ' + error.message, 'error');
                e.target.value = ''; // 清除文件选择
            }
        }
    });
    
    document.getElementById('clear-btn').addEventListener('click', () => {
        if (confirm('确定要清除所有保存的数据吗？此操作不可撤销。')) {
            if (DataManager.clearData()) {
                showDataStatus('数据已清除！', 'success');
            } else {
                showDataStatus('清除数据失败！', 'error');
            }
        }
    });
    
    document.getElementById('reset-btn').addEventListener('click', () => {
        if (confirm('确定要重置为默认数据吗？当前数据将被覆盖。')) {
            DataManager.resetToDefault();
            showDataStatus('已重置为默认数据！', 'success');
        }
    });
    
    document.getElementById('set-current-time-btn').addEventListener('click', () => {
        setCurrentTime();
        showDataStatus('已设置当前时间！', 'success');
        // 重置调试输出标记
        debugOutputShown = false;
        calculateBaseTimeFromData();
        renderTimetable();
    });
    
    document.getElementById('recalibrate-btn').addEventListener('click', () => {
        if (confirm('确定要重新校准基础时间吗？这将基于当前输入数据重新计算时间基准。')) {
            recalibrateBaseTime();
            renderTimetable();
        }
    });
    
    document.getElementById('debug-toggle-btn').addEventListener('click', () => {
        DEBUG_MODE = !DEBUG_MODE;
        const debugBtn = document.getElementById('debug-toggle-btn');
        debugBtn.textContent = DEBUG_MODE ? '关闭调试' : '开启调试';
        showDataStatus(`已切换调试模式: ${DEBUG_MODE ? '开启' : '关闭'}`, 'info');
        
        if (DEBUG_MODE) {
            // 开启调试模式时重置标记，重新计算并运行验证
            debugOutputShown = false;
            calculateBaseTimeFromData();
        }
        
        renderTimetable();
    });
    
    document.getElementById('run-test-btn').addEventListener('click', () => {
        quickTest();
    });
};

// 显示数据状态消息
const showDataStatus = (message, type = 'info') => {
    const statusElement = document.getElementById('data-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `data-status ${type}`;
        
        // 3秒后清除消息
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'data-status';
        }, 3000);
    }
};

// 初始化和事件监听
document.addEventListener('DOMContentLoaded', () => {
    createDataManagementButtons();
    
    const dataLoaded = DataManager.loadData();
    if (dataLoaded) {
        showDataStatus('已加载保存的数据', 'success');
        // 重置调试输出标记，确保首次加载时能输出调试信息
        debugOutputShown = false;
        calculateBaseTimeFromData();
        renderTimetable();
    } else {
        // 如果没有保存的数据，使用默认数据
        DataManager.resetToDefault();
        showDataStatus('已加载默认数据', 'info');
    }
    
    addInputListeners();
    
    setInterval(() => {
        renderTimetable();
    }, 1000);
});

// 独立测试函数
const runIndependentTest = () => {
    console.log('=== 独立测试开始（重新设计逻辑）===');
    
    // 测试createTimeInfo函数
    console.log('\n--- createTimeInfo函数测试 ---');
    const testCase = [2, '2025-06-26T16:54:07', '3:31'];
    const result = createTimeInfo(...testCase, true);
    
    console.log('输入:', testCase);
    console.log('输出时间戳:', result);
    console.log('输出时间:', new Date(result).toLocaleString('zh-CN'));
    
    // 手动验证新逻辑
    const inputTime = parseTimeStringAsLocal('2025-06-26T16:54:07');
    const displaySeconds = 3 * 60 + 31; // 3:31 = 211秒
    const checkInTime = 6 * 60; // 6分钟检票时间
    const elapsedCheckInTime = checkInTime - displaySeconds; // 已检票时间
    const expectedArrival = inputTime - elapsedCheckInTime * 1000;
    
    console.log('手动计算:');
    console.log('  当前时间:', new Date(inputTime).toLocaleString('zh-CN'));
    console.log('  离港剩余:', displaySeconds, '秒');
    console.log('  已检票时间:', elapsedCheckInTime, '秒');
    console.log('  计算到港时间:', new Date(expectedArrival).toLocaleString('zh-CN'));
    console.log('函数计算到港时间:', new Date(result).toLocaleString('zh-CN'));
    console.log('计算结果匹配:', Math.abs(result - expectedArrival) < 1000 ? '✅' : '❌');
    
    // 测试等候状态
    console.log('\n--- 等候状态测试 ---');
    const waitTestCase = [1, '2025-06-26T16:54:07', '2:15'];
    const waitResult = createTimeInfo(...waitTestCase, true);
    const waitInputTime = parseTimeStringAsLocal('2025-06-26T16:54:07');
    const waitDisplaySeconds = 2 * 60 + 15; // 2:15 = 135秒
    const waitExpectedArrival = waitInputTime + waitDisplaySeconds * 1000;
    
    console.log('等候状态输入:', waitTestCase);
    console.log('期望到港时间:', new Date(waitExpectedArrival).toLocaleString('zh-CN'));
    console.log('函数计算到港时间:', new Date(waitResult).toLocaleString('zh-CN'));
    console.log('等候状态匹配:', Math.abs(waitResult - waitExpectedArrival) < 1000 ? '✅' : '❌');
    
    console.log('\n=== 独立测试结束 ===');
};

// 测试验证函数
const validateTimeCalculation = () => {
    if (!DEBUG_MODE) return;
    
    console.log('=== 时刻表验证测试（重新设计逻辑）===');
    
    // 测试用例：塞拉港口第10线的实际观察数据
    const testCases = [
        [2, '2025-06-26T16:54:07', '3:31'],
        [2, '2025-06-26T17:03:30', '5:08'], 
        [2, '2025-06-26T17:17:40', '1:58'],
        [2, '2025-06-26T17:27:08', '3:31']
    ];
    
    console.log('测试用例数量:', testCases.length);
    
    // 使用第一个测试用例作为基准计算基础时间
    const baseTestCase = testCases[0];
    const baseArrivalTime = createTimeInfo(...baseTestCase, true);
    console.log('基准到港时间:', new Date(baseArrivalTime).toLocaleString('zh-CN'));
    
    // 临时设置基础时间进行测试
    const originalBaseTime = BaseTime.Irusan.base.Iria.timeStr;
    BaseTime.Irusan.base.Iria.timeStr = formatTimeAsLocalISO(baseArrivalTime);
    
    let passCount = 0;
    
    testCases.forEach((testCase, index) => {
        const [expectedStatus, timeStr, expectedRemain] = testCase;
        const testTime = parseTimeStringAsLocal(timeStr);
        
        console.log(`\n--- 测试用例 ${index + 1}: ${new Date(testTime).toLocaleString('zh-CN')} ---`);
        console.log('期望状态:', expectedStatus === 1 ? '等候' : '检票中');
        console.log('期望剩余:', expectedRemain);
        
        // 计算该测试用例的实际到港时间
        const actualArrivalTime = createTimeInfo(...testCase, true);
        console.log('实际到港时间:', new Date(actualArrivalTime).toLocaleString('zh-CN'));
        
        // 使用系统计算时刻表
        const times = FindCurrentTimes(testTime, 'Iria', 60, 'Irusan', 9, 3);
        if (times.length === 0) {
            console.log('❌ 无法生成时间表');
            return;
        }
        
        const status = checkStatus(times, testTime);
        if (status.group === -1) {
            console.log('❌ 无法确定状态');
            return;
        }
        
        const systemStatus = status.target === 0 ? 1 : 2;
        const systemRemainSeconds = Math.floor(status.timeOffset / 1000);
        const systemRemainStr = `${Math.floor(systemRemainSeconds / 60)}:${String(systemRemainSeconds % 60).padStart(2, '0')}`;
        
        console.log('系统状态:', systemStatus === 1 ? '等候' : '检票中');
        console.log('系统剩余:', systemRemainStr);
        
        // 验证
        const statusMatch = expectedStatus === systemStatus;
        const expectedRemainSeconds = parseInt(expectedRemain.split(':')[0]) * 60 + parseInt(expectedRemain.split(':')[1]);
        const timeDiff = Math.abs(expectedRemainSeconds - systemRemainSeconds);
        const timeMatch = timeDiff <= 3;
        
        const pass = statusMatch && timeMatch;
        console.log('状态匹配:', statusMatch ? '✓' : '❌');
        console.log('时间差异:', timeDiff, '秒');
        console.log('时间匹配:', timeMatch ? '✓' : '❌');
        console.log('整体结果:', pass ? '✅ 通过' : '❌ 失败');
        
        if (pass) passCount++;
    });
    
    console.log(`\n=== 验证测试总结: ${passCount}/${testCases.length} 通过 ===`);
    
    // 恢复原始基础时间
    BaseTime.Irusan.base.Iria.timeStr = originalBaseTime;
    
    return passCount === testCases.length;
};

// 简化测试函数
const quickTest = () => {
    console.log('=== 快速验证测试（重新设计逻辑）===');
    
    // 测试用例
    const testCases = [
        [2, '2025-06-26T16:54:07', '3:31'],
        [2, '2025-06-26T17:03:30', '5:08'], 
        [2, '2025-06-26T17:17:40', '1:58'],
        [2, '2025-06-26T17:27:08', '3:31']
    ];
    
    console.log('--- 新逻辑测试 ---');
    
    // 计算各测试用例的到港时间
    testCases.forEach((testCase, index) => {
        const [status, timeStr, displayTime] = testCase;
        const arrivalTime = createTimeInfo(status, timeStr, displayTime, true);
        
        console.log(`测试用例 ${index + 1}:`, {
            输入: testCase,
            观察时间: new Date(parseTimeStringAsLocal(timeStr)).toLocaleString('zh-CN'),
            状态: status === 1 ? '等候' : '检票中',
            显示时间: displayTime,
            计算到港时间: new Date(arrivalTime).toLocaleString('zh-CN')
        });
    });
    
    // 使用第一个测试用例设置基础时间
    const baseTestCase = testCases[0];
    const baseArrivalTime = createTimeInfo(...baseTestCase, true);
    
    console.log('\n--- 基础时间设置 ---');
    console.log('基准到港时间:', new Date(baseArrivalTime).toLocaleString('zh-CN'));
    
    // 临时设置基础时间进行测试
    const originalBaseTime = BaseTime.Irusan.base.Iria.timeStr;
    BaseTime.Irusan.base.Iria.timeStr = formatTimeAsLocalISO(baseArrivalTime);
    
    let passCount = 0;
    
    console.log('\n--- 系统计算验证 ---');
    testCases.forEach((testCase, index) => {
        const [expectedStatus, timeStr, expectedRemain] = testCase;
        const testTime = parseTimeStringAsLocal(timeStr);
        
        console.log(`\n测试用例 ${index + 1}: ${new Date(testTime).toLocaleString('zh-CN')}`);
        console.log('期望:', `${expectedStatus === 1 ? '等候' : '检票中'} ${expectedRemain}`);
        
        // 使用系统计算
        const times = FindCurrentTimes(testTime, 'Iria', 60, 'Irusan', 9, 3);
        if (times.length === 0) {
            console.log('❌ 无法生成时间表');
            return;
        }
        
        const status = checkStatus(times, testTime);
        if (status.group === -1) {
            console.log('❌ 无法确定状态');
            return;
        }
        
        const systemStatus = status.target === 0 ? 1 : 2;
        const systemRemainSeconds = Math.floor(status.timeOffset / 1000);
        const systemRemainStr = `${Math.floor(systemRemainSeconds / 60)}:${String(systemRemainSeconds % 60).padStart(2, '0')}`;
        
        console.log('系统:', `${systemStatus === 1 ? '等候' : '检票中'} ${systemRemainStr}`);
        
        // 验证
        const statusMatch = expectedStatus === systemStatus;
        const expectedRemainSeconds = parseInt(expectedRemain.split(':')[0]) * 60 + parseInt(expectedRemain.split(':')[1]);
        const timeDiff = Math.abs(expectedRemainSeconds - systemRemainSeconds);
        const timeMatch = timeDiff <= 3;
        
        const pass = statusMatch && timeMatch;
        console.log('结果:', pass ? '✅ 通过' : '❌ 失败', `(状态${statusMatch ? '✓' : '❌'}, 时间差${timeDiff}s)`);
        
        if (pass) passCount++;
    });
    
    console.log(`\n=== 测试总结: ${passCount}/${testCases.length} 通过 ===`);
    
    // 恢复原始基础时间
    BaseTime.Irusan.base.Iria.timeStr = originalBaseTime;
    
    const testSuccess = passCount === testCases.length;
    showDataStatus(`测试${testSuccess ? '全部通过' : '部分失败'}: ${passCount}/${testCases.length}`, testSuccess ? 'success' : 'error');
    
    return testSuccess;
};

// 导出函数供调试使用
window.FerryTimetable = {
    renderTimetable,
    generateTimetableData,
    calculateBaseTimeFromData,
    DataManager,
    BaseTime,
    Ferry,
    setCurrentTime,
    validateTimeCalculation,
    quickTest
};

// 导出全局函数
window.switchChannel = switchChannel;
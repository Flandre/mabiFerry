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

// 轮渡路线配置
const Ferry = [
    {
        from: 'Port Sella',
        to: 'Port Ceann',
        baseTime: 'Iria',
        timeOffset: 60,
    },
    {
        from: 'Port Connous',
        to: 'Port Ceann',
        baseTime: 'Iria',
        timeOffset: 60,
    },
    {
        from: 'Port Ceann',
        to: 'Port Sella',
        baseTime: 'Iria',
        timeOffset: 0,
    },
    {
        from: 'Port Ceann',
        to: 'Port Connous',
        baseTime: 'Iria',
        timeOffset: 30,
    },
    {
        from: 'Port Cobh',
        to: 'Port Qilla',
        baseTime: 'Iria',
        timeOffset: 0,
        checkTicket: true
    },
    {
        from: 'Port Qilla',
        to: 'Port Cobh',
        baseTime: 'Iria',
        timeOffset: 30,
    },
    {
        from: 'Port Cobh',
        to: 'Belvast Island',
        baseTime: 'Belvast',
        timeOffset: 0,
        checkTicket: true
    },
    {
        from: 'Belvast Island',
        to: 'Port Cobh',
        baseTime: 'Belvast',
        timeOffset: 30,
    }
];

// 基础时间配置
let BaseTime = {
    Irusan: {
        base: {
            Iria: {
                timeStr: '2022-08-04T01:42:27',
                interval: [5*60*1000, 6*60*1000, 4*60*1000], // 等待到港时间，等待开船时间，等待到目的地时间
            },
            Belvast: {
                timeStr: '2022-08-04T03:07:35',
                interval: [(2*60+30)*1000, (3*60+30)*1000, 2*60*1000]
            }
        },
        channelOffset: [-300, -70, -25, -10, -55, 0, -21, -10, 0, 0]
    }
};

// 数据保存和恢复功能
const DataManager = {
    STORAGE_KEY: 'ferry_timetable_data',
    
    // 保存数据到localStorage
    saveData() {
        try {
            const data = {
                iriaData: this.collectIriaData(),
                belvastData: this.collectBelvastData(),
                currentChannel: document.getElementById('current-channel')?.value || '9',
                calculatedResults: {
                    iriaBaseTime: BaseTime.Irusan.base.Iria.timeStr,
                    belvastBaseTime: BaseTime.Irusan.base.Belvast.timeStr,
                    channelOffset: BaseTime.Irusan.channelOffset
                },
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            console.log('数据已保存到localStorage');
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    },
    
    // 从localStorage加载数据
    loadData() {
        try {
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            if (!savedData) {
                console.log('未找到保存的数据');
                return false;
            }
            
            const data = JSON.parse(savedData);
            console.log('加载保存的数据:', data);
            
            // 恢复伊利亚数据
            if (data.iriaData) {
                this.restoreIriaData(data.iriaData);
            }
            
            // 恢复贝尔法斯特数据
            if (data.belvastData) {
                this.restoreBelvastData(data.belvastData);
            }
            
            // 恢复当前线路选择
            if (data.currentChannel) {
                const channelSelect = document.getElementById('current-channel');
                if (channelSelect) {
                    channelSelect.value = data.currentChannel;
                }
            }
            
            // 恢复计算结果
            if (data.calculatedResults) {
                BaseTime.Irusan.base.Iria.timeStr = data.calculatedResults.iriaBaseTime;
                BaseTime.Irusan.base.Belvast.timeStr = data.calculatedResults.belvastBaseTime;
                BaseTime.Irusan.channelOffset = data.calculatedResults.channelOffset;
            }
            
            return true;
        } catch (error) {
            console.error('加载数据失败:', error);
            return false;
        }
    },
    
    // 收集伊利亚数据
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
    
    // 收集贝尔法斯特数据
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
    
    // 恢复伊利亚数据
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
    
    // 恢复贝尔法斯特数据
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
    
    // 导出数据为JSON文件
    exportData() {
        try {
            const data = {
                iriaData: this.collectIriaData(),
                belvastData: this.collectBelvastData(),
                currentChannel: document.getElementById('current-channel')?.value || '9',
                calculatedResults: {
                    iriaBaseTime: BaseTime.Irusan.base.Iria.timeStr,
                    belvastBaseTime: BaseTime.Irusan.base.Belvast.timeStr,
                    channelOffset: BaseTime.Irusan.channelOffset
                },
                timestamp: new Date().toISOString(),
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
            
            console.log('数据已导出');
            return true;
        } catch (error) {
            console.error('导出数据失败:', error);
            return false;
        }
    },
    
    // 导入数据从JSON文件
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
                    
                    // 验证数据格式
                    if (!data.iriaData && !data.belvastData) {
                        throw new Error('无效的数据格式');
                    }
                    
                    // 恢复数据
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
                    
                    // 保存到localStorage
                    this.saveData();
                    
                    // 重新计算
                    calculateBaseTimeFromData();
                    renderTimetable();
                    
                    console.log('数据导入成功');
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
    
    // 清除所有数据
    clearData() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            
            // 重置表单数据为默认值
            this.resetToDefault();
            
            console.log('数据已清除');
            return true;
        } catch (error) {
            console.error('清除数据失败:', error);
            return false;
        }
    },
    
    // 重置为默认数据
    resetToDefault() {
        // 重置伊利亚数据为默认示例
        const defaultIriaData = [
            { status: '2', currentTime: '2025-02-18T15:35:03', displayTime: '1:09' },
            { status: '2', currentTime: '2025-02-18T15:34:42', displayTime: '2:06' },
            { status: '2', currentTime: '2025-02-18T15:34:22', displayTime: '0:53' },
            { status: '2', currentTime: '2025-02-18T15:34:01', displayTime: '1:55' },
            { status: '2', currentTime: '2025-02-18T15:33:45', displayTime: '4:08' },
            { status: '2', currentTime: '2025-02-18T15:33:25', displayTime: '2:42' },
            { status: '2', currentTime: '2025-02-18T15:33:07', displayTime: '5:14' },
            { status: '2', currentTime: '2025-02-18T15:32:45', displayTime: '1:31' },
            { status: '2', currentTime: '2025-02-18T15:32:23', displayTime: '3:44' },
            { status: '2', currentTime: '2025-02-18T15:31:21', displayTime: '3:53' }
        ];
        
        // 重置贝尔法斯特数据为默认示例
        const defaultBelvastData = [
            { status: '1', currentTime: '2025-02-18T15:38:27', displayTime: '0:47' }
        ];
        
        this.restoreIriaData(defaultIriaData);
        this.restoreBelvastData(defaultBelvastData);
        
        // 重置线路选择
        const channelSelect = document.getElementById('current-channel');
        if (channelSelect) {
            channelSelect.value = '9';
        }
        
        // 重新计算
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

// 解析显示时间格式 "分:秒"
const parseDisplayTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') {
        console.warn('Invalid display time:', timeStr);
        return 0;
    }
    const parts = timeStr.split(':');
    if (parts.length !== 2) {
        console.warn('Invalid display time format:', timeStr);
        return 0;
    }
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
};

// 创建时间信息
const createTimeInfo = (type, now, show) => {
    const displaySeconds = parseDisplayTime(show);
    const currentTime = new Date(now.replace('T', ' ')).getTime();
    return currentTime + displaySeconds * 1000 * Math.pow(-1, type);
};

// 从输入数据计算基础时间和偏移
const calculateBaseTimeFromData = () => {
    try {
        console.log('开始计算基础时间...');
        
        // 收集伊利亚数据
        const iriaData = [];
        const iriaRows = document.querySelectorAll('#iria-data .data-row');
        console.log('找到伊利亚数据行数:', iriaRows.length);
        
        iriaRows.forEach((row, index) => {
            const statusSelect = row.querySelector('.status-select');
            const currentTimeInput = row.querySelector('.current-time');
            const displayTimeInput = row.querySelector('.display-time');
            
            if (statusSelect && currentTimeInput && displayTimeInput) {
                const status = parseInt(statusSelect.value);
                const currentTime = currentTimeInput.value;
                const displayTime = displayTimeInput.value;
                
                if (currentTime && displayTime) {
                    iriaData.push([status, currentTime, displayTime]);
                    console.log(`线路${index + 1}数据:`, [status, currentTime, displayTime]);
                }
            }
        });

        console.log('收集到的伊利亚数据:', iriaData);

        // 收集贝尔法斯特数据
        const belvastData = [];
        const belvastRows = document.querySelectorAll('#belvast-data .data-row');
        console.log('找到贝尔法斯特数据行数:', belvastRows.length);
        
        belvastRows.forEach((row) => {
            const statusSelect = row.querySelector('.status-select');
            const currentTimeInput = row.querySelector('.current-time');
            const displayTimeInput = row.querySelector('.display-time');
            
            if (statusSelect && currentTimeInput && displayTimeInput) {
                const status = parseInt(statusSelect.value);
                const currentTime = currentTimeInput.value;
                const displayTime = displayTimeInput.value;
                
                if (currentTime && displayTime) {
                    belvastData.push([status, currentTime, displayTime]);
                    console.log('贝尔法斯特数据:', [status, currentTime, displayTime]);
                }
            }
        });

        // 计算伊利亚基础时间和偏移
        if (iriaData.length >= 2) {
            console.log('开始计算伊利亚基础时间...');
            const baseLoopTime = BaseTime.Irusan.base.Iria.interval[0] + BaseTime.Irusan.base.Iria.interval[1];
            console.log('基础循环时间:', baseLoopTime);
            
            const channelBase = iriaData.slice(1).map(x => {
                const timeInfo = createTimeInfo(...x);
                console.log('createTimeInfo结果:', timeInfo, 'for data:', x);
                return timeInfo % baseLoopTime;
            });
            console.log('频道基础时间:', channelBase);
            
            const channelOffsetBase = channelBase[channelBase.length - 1];
            console.log('频道偏移基准:', channelOffsetBase);
            
            const channelOffset = channelBase.map(x => {
                let base = x - channelOffsetBase;
                if (Math.abs(base) < baseLoopTime / 2) {
                    return Math.floor(base / 1000);
                } else {
                    if (base < 0) {
                        return Math.floor((base + baseLoopTime) / 1000);
                    } else {
                        return Math.floor((base - baseLoopTime) / 1000);
                    }
                }
            });
            console.log('计算的频道偏移:', channelOffset);

            // 更新基础时间配置
            BaseTime.Irusan.channelOffset = [0, ...channelOffset]; // 线路1为基准(0)，后面是线路2-10的偏移
            
            // 使用最后一个数据作为基准时间
            const baseTimeValue = createTimeInfo(...iriaData[iriaData.length - 1]);
            BaseTime.Irusan.base.Iria.timeStr = new Date(baseTimeValue).toISOString().slice(0, 19);
            console.log('计算的伊利亚基础时间:', BaseTime.Irusan.base.Iria.timeStr);
            
            // 显示计算的伊利亚基础时间
            const calculatedIriaElement = document.getElementById('calculated-iria-time');
            if (calculatedIriaElement) {
                calculatedIriaElement.textContent = new Date(BaseTime.Irusan.base.Iria.timeStr).toLocaleString('zh-CN');
            }
        } else {
            console.warn('伊利亚数据不足，需要至少2条数据');
            const calculatedIriaElement = document.getElementById('calculated-iria-time');
            if (calculatedIriaElement) {
                calculatedIriaElement.textContent = '数据不足（需要至少2条）';
            }
        }

        // 计算贝尔法斯特基础时间
        if (belvastData.length > 0) {
            console.log('开始计算贝尔法斯特基础时间...');
            const baseTimeValue = createTimeInfo(...belvastData[0]);
            BaseTime.Irusan.base.Belvast.timeStr = new Date(baseTimeValue).toISOString().slice(0, 19);
            console.log('计算的贝尔法斯特基础时间:', BaseTime.Irusan.base.Belvast.timeStr);
            
            // 显示计算的贝尔法斯特基础时间
            const calculatedBelvastElement = document.getElementById('calculated-belvast-time');
            if (calculatedBelvastElement) {
                calculatedBelvastElement.textContent = new Date(BaseTime.Irusan.base.Belvast.timeStr).toLocaleString('zh-CN');
            }
        } else {
            console.warn('贝尔法斯特数据不足');
            const calculatedBelvastElement = document.getElementById('calculated-belvast-time');
            if (calculatedBelvastElement) {
                calculatedBelvastElement.textContent = '未输入数据';
            }
        }

        console.log('计算完成的基础时间:', BaseTime.Irusan);
        console.log('线路偏移:', BaseTime.Irusan.channelOffset);

        // 自动保存计算结果
        DataManager.saveData();

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
    let base = new Date(timeStr);
    let baseTime = base.getTime() - interval[0] + (BaseTime[server].channelOffset[channel] || 0) * 1000;
    let waitTime = baseTime + Math.floor((now - (baseTime + timeOffset * 1000)) / (interval[0] + interval[1])) * (interval[0] + interval[1]) + timeOffset * 1000;
    
    let out = [], tmpTime;
    for(let i = 0; i < count; i++) {
        if(i) {
            out.push([
                tmpTime,
                tmpTime + interval[0],
                tmpTime + interval[0] + interval[1],
                tmpTime + interval[0] + interval[1] + interval[2]
            ]);
            tmpTime = tmpTime + interval[0] + interval[1];
        } else {
            out.push([
                waitTime,
                waitTime + interval[0],
                waitTime + interval[0] + interval[1],
                waitTime + interval[0] + interval[1] + interval[2]
            ]);
            tmpTime = waitTime + interval[0] + interval[1];
        }
    }
    return out;
};

// 检查状态
const checkStatus = (times, targetTs) => {
    for(let i = 0; i < times.length; i++) {
        let targetGroup = times[i];
        if(targetTs < targetGroup[1] && targetTs >= targetGroup[0]){
            return {
                group: i,
                target: 0,
                timeOffset: targetGroup[1] - targetTs
            };
        }
        if(targetTs < targetGroup[2] && targetTs >= targetGroup[1]){
            return {
                group: i,
                target: 1,
                timeOffset: targetGroup[2] - targetTs
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
    
    // 获取所有港口
    const ports = Array.from(new Set(Ferry.map(x => x.from)));
    
    return ports.map(port => {
        return {
            label: port,
            arrival: Ferry.filter(x => x.from == port).map(routing => {
                let times = FindCurrentTimes(now, routing.baseTime, routing.timeOffset, server, channel, 3);
                return {
                    to: routing.to,
                    times,
                    status: checkStatus(times, now)
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
                ${port.arrival.map(arrival => arrival.times.map((time, index) => `
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
                `).join('')).join('')}
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
            calculateBaseTimeFromData();
            renderTimetable();
        });
        input.addEventListener('input', () => {
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
    console.log('页面加载完成，开始初始化...');
    
    // 创建数据管理按钮
    createDataManagementButtons();
    
    // 尝试加载保存的数据
    const dataLoaded = DataManager.loadData();
    if (dataLoaded) {
        showDataStatus('已加载保存的数据', 'success');
    }
    
    // 初始计算基础时间
    calculateBaseTimeFromData();
    
    // 初始渲染
    renderTimetable();
    
    // 添加事件监听器
    addInputListeners();
    
    // 每秒更新一次时刻表
    setInterval(() => {
        renderTimetable();
    }, 1000);
});

// 导出函数供调试使用
window.FerryTimetable = {
    renderTimetable,
    generateTimetableData,
    calculateBaseTimeFromData,
    DataManager,
    BaseTime,
    Ferry
};

// 导出全局函数
window.switchChannel = switchChannel; 
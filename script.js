class PromptGenerator {
    constructor() {
        this.prompts = [];
        this.countdown = 60;
        this.autoGenerateInterval = null;
        this.countdownInterval = null;
        this.claudeApiKey = localStorage.getItem('claudeApiKey') || '';
        this.loadHistoryFromStorage();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupApiKeyInterface();
        this.setupHistoryControls();
        this.startAutoGeneration();
        this.addSystemMessage();
        this.renderHistory(); // 저장된 히스토리 렌더링
    }

    loadHistoryFromStorage() {
        try {
            const savedHistory = localStorage.getItem('promptHistory');
            if (savedHistory) {
                this.prompts = JSON.parse(savedHistory);
                console.log(`${this.prompts.length}개의 히스토리를 불러왔습니다.`);
            }
        } catch (error) {
            console.error('히스토리 로드 오류:', error);
            this.prompts = [];
        }
    }

    saveHistoryToStorage() {
        try {
            localStorage.setItem('promptHistory', JSON.stringify(this.prompts));
        } catch (error) {
            console.error('히스토리 저장 오류:', error);
            // 용량 초과 시 오래된 항목들 삭제
            if (error.name === 'QuotaExceededError') {
                this.prompts = this.prompts.slice(0, 50); // 최신 50개만 유지
                try {
                    localStorage.setItem('promptHistory', JSON.stringify(this.prompts));
                    this.addChatMessage('저장 공간 부족으로 오래된 히스토리 일부가 삭제되었습니다.');
                } catch (e) {
                    console.error('히스토리 용량 정리 실패:', e);
                }
            }
        }
    }

    setupEventListeners() {
        const generateBtn = document.getElementById('generateBtn');
        const promptRequest = document.getElementById('promptRequest');

        generateBtn.addEventListener('click', async () => {
            const request = promptRequest.value.trim();
            
            if (!request) {
                this.addChatMessage('키워드를 입력해주세요!');
                return;
            }
            
            // 로딩 상태 표시
            generateBtn.textContent = '생성 중...';
            generateBtn.disabled = true;
            
            try {
                await this.generateCustomPrompt(request);
                promptRequest.value = '';
            } catch (error) {
                console.error('프롬프트 생성 오류:', error);
                this.addChatMessage('프롬프트 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
            } finally {
                // 로딩 상태 해제
                generateBtn.textContent = '프롬프트 생성';
                generateBtn.disabled = false;
            }
        });

        // 자동 생성 체크박스 이벤트
        const autoGenerateCheckbox = document.getElementById('autoGenerate');
        autoGenerateCheckbox.addEventListener('change', () => {
            if (autoGenerateCheckbox.checked) {
                this.startAutoGeneration();
            } else {
                this.stopAutoGeneration();
            }
        });

        promptRequest.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                generateBtn.click();
            }
        });
    }

    setupApiKeyInterface() {
        const apiKeyInput = document.getElementById('claudeApiKey');
        const saveApiKeyBtn = document.getElementById('saveApiKey');
        const apiStatus = document.getElementById('apiStatus');

        // 저장된 API 키가 있으면 마스킹해서 표시
        if (this.claudeApiKey) {
            apiKeyInput.value = '••••••••••••••••••••••••••••••••••••••••••••••••••••';
            apiStatus.textContent = 'API 키 저장됨';
            apiStatus.className = 'api-status success';
        }

        apiKeyInput.addEventListener('input', (e) => {
            if (e.target.value !== '••••••••••••••••••••••••••••••••••••••••••••••••••••') {
                apiStatus.textContent = '';
                apiStatus.className = 'api-status';
            }
        });

        saveApiKeyBtn.addEventListener('click', () => {
            const keyValue = apiKeyInput.value.trim();
            if (keyValue && keyValue !== '••••••••••••••••••••••••••••••••••••••••••••••••••••') {
                this.claudeApiKey = keyValue;
                localStorage.setItem('claudeApiKey', keyValue);
                apiKeyInput.value = '••••••••••••••••••••••••••••••••••••••••••••••••••••';
                apiStatus.textContent = 'API 키가 저장되었습니다';
                apiStatus.className = 'api-status success';
                this.addChatMessage('Claude API 키가 설정되었습니다. 이제 AI가 생성하는 프롬프트를 이용할 수 있습니다!');
            } else {
                apiStatus.textContent = '유효한 API 키를 입력해주세요';
                apiStatus.className = 'api-status error';
            }
        });
    }

    async callClaudeAPI(prompt) {
        if (!this.claudeApiKey) {
            throw new Error('Claude API 키가 설정되지 않았습니다.');
        }

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.claudeApiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1000,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            console.error('Claude API 호출 오류:', error);
            throw error;
        }
    }

    addSystemMessage() {
        const chatMessages = document.getElementById('chatMessages');
        const timestamp = document.querySelector('.message.system .timestamp');
        timestamp.textContent = this.getCurrentTime();
    }

    addChatMessage(message, isUser = false) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'system'}`;
        
        messageDiv.innerHTML = `
            <span class="timestamp">${this.getCurrentTime()}</span>
            <span class="content">${message}</span>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async generateRandomPrompt() {
        const aspectRatio = this.getSelectedAspectRatio();
        
        if (!this.claudeApiKey) {
            // 폴백: 기본 프롬프트 생성
            return this.generateFallbackPrompt(aspectRatio);
        }

        try {
            const claudePrompt = `Create a unique and creative Midjourney prompt for a QWER-style K-pop girl group music video scene. 

Requirements:
- 4-member rock/alternative K-pop girl group like QWER
- Each member should have distinct individual styling and personality
- Include authentic musician elements (instruments, performance aspects)
- Mix of edgy and cute styling elements
- Creative and unexpected scene concepts
- Professional music video quality descriptions
- Specific camera angles and lighting details
- Rich visual descriptions with colors, textures, atmosphere

Format the response as a complete Midjourney prompt ending with: professional music video quality, ultra-detailed, photorealistic, 8K resolution, --ar ${aspectRatio} --v 6

Generate only the prompt text, no additional explanation.`;

            const aiPrompt = await this.callClaudeAPI(claudePrompt);
            
            this.addPromptToHistory(aiPrompt.trim());
            this.addChatMessage('AI가 새로운 창의적인 프롬프트를 생성했습니다!');
            
            return aiPrompt.trim();
        } catch (error) {
            console.error('AI 프롬프트 생성 실패:', error);
            this.addChatMessage('AI 생성 실패, 기본 프롬프트를 사용합니다.');
            return this.generateFallbackPrompt(aspectRatio);
        }
    }

    generateFallbackPrompt(aspectRatio) {
        const fallbackScenes = [
            'QWER-style rock K-pop girl group performing with electric guitars in neon-lit underground venue',
            'four-member alternative girl band in edgy streetwear dancing on rooftop with city skyline',
            'rock-influenced K-pop group with colorful hair playing instruments in abandoned warehouse'
        ];
        
        const scene = fallbackScenes[Math.floor(Math.random() * fallbackScenes.length)];
        const prompt = `${scene}, each member with distinct personal styling, mix of feminine and edgy elements, professional music video quality, ultra-detailed, photorealistic, 8K resolution, --ar ${aspectRatio} --v 6`;
        
        this.addPromptToHistory(prompt);
        this.addChatMessage('새로운 프롬프트가 생성되었습니다!');
        
        return prompt;
    }

    translateKoreanToEnglish(koreanText) {
        const translations = {
            // 장소/위치
            '네온': 'neon',
            '도시': 'city',
            '밤': 'night',
            '무대': 'stage',
            '옥상': 'rooftop',
            '지하': 'underground',
            '클럽': 'club',
            '카페': 'cafe',
            '학교': 'school',
            '교실': 'classroom',
            '복도': 'hallway',
            '운동장': 'playground',
            '바다': 'ocean',
            '해변': 'beach',
            '산': 'mountain',
            '공원': 'park',
            '거리': 'street',
            '골목': 'alley',
            '건물': 'building',
            '창고': 'warehouse',
            '스튜디오': 'studio',
            
            // 이벤트/콘서트
            '워터밤': 'water bomb festival',
            '콘서트': 'concert',
            '페스티벌': 'festival',
            '축제': 'festival',
            '파티': 'party',
            '쇼': 'show',
            
            // 동작/활동
            '춤': 'dance',
            '노래': 'sing',
            '공연': 'performance',
            '연주': 'playing instruments',
            '포즈': 'pose',
            '걷기': 'walking',
            '뛰기': 'running',
            
            // 스타일/외관
            '의상': 'outfit',
            '조명': 'lighting',
            '배경': 'background',
            '화려한': 'glamorous',
            '아름다운': 'beautiful',
            '멋진': 'cool',
            '예쁜': 'pretty',
            '강렬한': 'intense',
            '부드러운': 'soft',
            '어두운': 'dark',
            '밝은': 'bright',
            '컬러풀한': 'colorful',
            '빈티지': 'vintage',
            '모던': 'modern',
            '클래식': 'classic',
            '로맨틱': 'romantic',
            '드라마틱': 'dramatic',
            
            // 기본 단어
            '장면': 'scene',
            '분위기': 'atmosphere',
            '느낌': 'vibe',
            '스타일': 'style',
            '컨셉': 'concept',
            '테마': 'theme',
            '이미지': 'image',
            '사진': 'photo',
            '영상': 'video',
            '뮤직비디오': 'music video',
            
            // 물/여름 관련
            '물': 'water',
            '여름': 'summer',
            '시원한': 'cool refreshing',
            '젖은': 'wet',
            '물놀이': 'water play',
            '수영복': 'swimwear',
            '비키니': 'bikini'
        };
        
        let englishText = koreanText;
        
        // 긴 구문부터 먼저 번역 (더 정확한 번역을 위해)
        const sortedTranslations = Object.entries(translations).sort((a, b) => b[0].length - a[0].length);
        
        for (const [korean, english] of sortedTranslations) {
            englishText = englishText.replace(new RegExp(korean, 'g'), english);
        }
        
        return englishText;
    }

    getSelectedModel() {
        const modelSelect = document.getElementById('aiModel');
        return modelSelect ? modelSelect.value : 'midjourney';
    }

    generateFallbackPrompt(translatedRequest, aspectRatio, model) {
        const basePrompt = translatedRequest;
        
        switch(model) {
            case 'midjourney':
                return `${basePrompt}, cinematic composition, professional photography, dramatic lighting, rich colors, ultra-detailed, photorealistic, 8K quality, --ar ${aspectRatio} --v 6 --style raw`;
                
            case 'stable-diffusion':
                return `${basePrompt}, masterpiece, best quality, ultra high res, photorealistic, cinematic lighting, detailed background, professional composition, vibrant colors, sharp focus, 8k uhd, dslr, soft lighting, high quality, film grain`;
                
            case 'novelai':
                return `{${basePrompt}}, masterpiece, best quality, amazing quality, very aesthetic, highres, ultra-detailed, scenic, beautiful, cinematic lighting, perfect composition`;
                
            case 'dall-e':
                return `High-quality photograph of ${basePrompt}, professional photography, cinematic composition, dramatic lighting, photorealistic, detailed, 8K resolution`;
                
            case 'leonardo':
                return `${basePrompt}, cinematic, photorealistic, ultra detailed, dramatic lighting, professional photography, 8k resolution, beautiful composition, award-winning photography`;
                
            default:
                return `${basePrompt}, high quality, detailed, professional, cinematic lighting`;
        }
    }

    getModelSpecificSystemPrompt(model) {
        const modelPrompts = {
            'midjourney': `Create a detailed Midjourney prompt optimized for photorealistic image generation. Focus on:
- Cinematic composition and lighting
- Specific camera angles and photography techniques
- Art styles and aesthetic qualities
- Technical parameters (--ar, --v, --style, etc.)
- Rich visual descriptions of characters, environments, mood, and atmosphere`,

            'stable-diffusion': `Create a detailed Stable Diffusion prompt optimized for high-quality image generation. Focus on:
- Quality modifiers (masterpiece, best quality, ultra high res)
- Detailed character descriptions and environments
- Lighting and composition techniques
- Art style specifications
- Negative space considerations for optimal results`,

            'novelai': `Create a detailed NovelAI prompt using their tag-based system. Focus on:
- Quality tags in curly braces {masterpiece, best quality}
- Character and environment descriptions
- Art style and aesthetic tags
- Composition and lighting descriptors
- Mood and atmosphere elements`,

            'dall-e': `Create a clear, descriptive DALL-E prompt focusing on:
- Natural language descriptions
- Specific visual details
- Photography and composition terms
- Art styles and techniques
- Clear subject and background descriptions`,

            'leonardo': `Create a detailed Leonardo AI prompt optimized for their models. Focus on:
- Cinematic and photorealistic qualities
- Detailed character and environment descriptions
- Professional photography techniques
- Lighting and mood specifications
- High-quality technical descriptors`
        };

        return modelPrompts[model] || modelPrompts['midjourney'];
    }

    async generateCustomPrompt(request) {
        const aspectRatio = this.getSelectedAspectRatio();
        const selectedModel = this.getSelectedModel();
        
        if (!this.claudeApiKey) {
            // 폴백: 기본 번역 및 모델별 프롬프트 생성
            const translatedRequest = this.translateKoreanToEnglish(request);
            const enhancedPrompt = this.generateFallbackPrompt(translatedRequest, aspectRatio, selectedModel);
            
            this.addPromptToHistory(enhancedPrompt, request);
            this.addChatMessage(`"${request}"에 대한 ${selectedModel} 프롬프트가 생성되었습니다!`, true);
            
            return enhancedPrompt;
        }

        try {
            const modelSystemPrompt = this.getModelSpecificSystemPrompt(selectedModel);
            const claudePrompt = `${modelSystemPrompt}

User request: "${request}"
Selected model: ${selectedModel}
Aspect ratio: ${aspectRatio}

Create a detailed image generation prompt that:
1. Interprets the user's keywords creatively for ${selectedModel}
2. Includes rich visual descriptions (character, background, composition, lighting, colors, mood)
3. Uses appropriate technical parameters for ${selectedModel}
4. Focuses on artistic and aesthetic elements
5. If the request is in Korean, interpret it naturally and create an English prompt

Generate only the prompt text optimized for ${selectedModel}, no additional explanation.`;

            const aiPrompt = await this.callClaudeAPI(claudePrompt);
            
            this.addPromptToHistory(aiPrompt.trim(), request);
            this.addChatMessage(`AI가 "${request}" 키워드로 ${selectedModel}용 프롬프트를 생성했습니다!`, true);
            
            return aiPrompt.trim();
        } catch (error) {
            console.error('AI 프롬프트 생성 실패:', error);
            this.addChatMessage('AI 생성 실패, 기본 프롬프트를 사용합니다.');
            
            // 폴백 처리
            const translatedRequest = this.translateKoreanToEnglish(request);
            const enhancedPrompt = this.generateFallbackPrompt(translatedRequest, aspectRatio, selectedModel);
            
            this.addPromptToHistory(enhancedPrompt, request);
            this.addChatMessage(`"${request}"에 대한 기본 프롬프트가 생성되었습니다!`, true);
            
            return enhancedPrompt;
        }
    }

    getSelectedAspectRatio() {
        const selectedRatio = document.querySelector('input[name="aspectRatio"]:checked');
        return selectedRatio ? selectedRatio.value : '16:9';
    }

    addPromptToHistory(prompt, originalRequest = null) {
        const historyItem = {
            id: Date.now(),
            prompt: prompt,
            originalRequest: originalRequest,
            timestamp: this.getCurrentTime(),
            aspectRatio: this.getSelectedAspectRatio(),
            dateCreated: new Date().toISOString() // 정확한 날짜 저장
        };

        this.prompts.unshift(historyItem);
        this.renderHistory();
        this.saveHistoryToStorage(); // 히스토리 저장
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        const historyCount = document.getElementById('historyCount');
        
        historyList.innerHTML = '';
        historyCount.textContent = this.prompts.length;

        this.prompts.forEach(item => {
            const historyDiv = document.createElement('div');
            historyDiv.className = 'history-item';
            
            historyDiv.innerHTML = `
                <div class="history-item-header">
                    <span class="timestamp">${item.timestamp} | ${item.aspectRatio}</span>
                    <button class="delete-btn" onclick="promptGenerator.deleteHistoryItem('${item.id}')" title="삭제">×</button>
                </div>
                ${item.originalRequest ? `<div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">요청: "${item.originalRequest}"</div>` : ''}
                <div class="prompt">${item.prompt}</div>
                <div class="history-item-actions">
                    <button class="copy-btn" onclick="promptGenerator.copyToClipboard('${item.id}')">복사</button>
                </div>
            `;
            
            historyList.appendChild(historyDiv);
        });
    }

    copyToClipboard(id) {
        const item = this.prompts.find(p => p.id == id);
        if (item) {
            navigator.clipboard.writeText(item.prompt).then(() => {
                this.addChatMessage('프롬프트가 클립보드에 복사되었습니다!');
            });
        }
    }

    deleteHistoryItem(id) {
        if (confirm('이 프롬프트를 삭제하시겠습니까?')) {
            this.prompts = this.prompts.filter(item => item.id != id);
            this.renderHistory();
            this.saveHistoryToStorage();
            this.addChatMessage('히스토리 항목이 삭제되었습니다.');
        }
    }

    clearAllHistory() {
        if (confirm('모든 히스토리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            this.prompts = [];
            this.renderHistory();
            this.saveHistoryToStorage();
            this.addChatMessage('모든 히스토리가 삭제되었습니다.');
        }
    }

    exportHistory() {
        try {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                totalCount: this.prompts.length,
                prompts: this.prompts
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `midjourney-prompts-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.addChatMessage(`${this.prompts.length}개의 프롬프트가 내보내기 되었습니다.`);
        } catch (error) {
            console.error('내보내기 오류:', error);
            this.addChatMessage('내보내기 중 오류가 발생했습니다.');
        }
    }

    importHistory(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (importData.prompts && Array.isArray(importData.prompts)) {
                    const importCount = importData.prompts.length;
                    
                    if (confirm(`${importCount}개의 프롬프트를 가져오시겠습니까? 기존 히스토리에 추가됩니다.`)) {
                        // ID 충돌 방지를 위해 새 ID 생성
                        const newPrompts = importData.prompts.map(item => ({
                            ...item,
                            id: Date.now() + Math.random() // 고유 ID 생성
                        }));
                        
                        this.prompts = [...newPrompts, ...this.prompts];
                        this.renderHistory();
                        this.saveHistoryToStorage();
                        this.addChatMessage(`${importCount}개의 프롬프트가 성공적으로 가져와졌습니다.`);
                    }
                } else {
                    throw new Error('올바르지 않은 파일 형식입니다.');
                }
            } catch (error) {
                console.error('가져오기 오류:', error);
                this.addChatMessage('파일을 읽는 중 오류가 발생했습니다. 올바른 JSON 파일인지 확인해주세요.');
            }
        };
        reader.readAsText(file);
    }

    setupHistoryControls() {
        const clearBtn = document.getElementById('clearHistoryBtn');
        const exportBtn = document.getElementById('exportHistoryBtn');
        const importBtn = document.getElementById('importHistoryBtn');
        const importFile = document.getElementById('importFile');

        clearBtn.addEventListener('click', () => {
            this.clearAllHistory();
        });

        exportBtn.addEventListener('click', () => {
            this.exportHistory();
        });

        importBtn.addEventListener('click', () => {
            importFile.click();
        });

        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importHistory(file);
            }
            e.target.value = ''; // 파일 선택 초기화
        });
    }

    startAutoGeneration() {
        const promptRequest = document.getElementById('promptRequest');
        const keywords = promptRequest.value.trim();
        
        if (!keywords) {
            this.addChatMessage('자동 생성을 위해서는 키워드를 입력해주세요!');
            document.getElementById('autoGenerate').checked = false;
            return;
        }

        this.autoGenerateInterval = setInterval(async () => {
            try {
                const currentKeywords = document.getElementById('promptRequest').value.trim();
                if (currentKeywords) {
                    await this.generateCustomPrompt(currentKeywords);
                    this.resetCountdown();
                } else {
                    this.addChatMessage('키워드가 없어 자동 생성을 중단합니다.');
                    this.stopAutoGeneration();
                }
            } catch (error) {
                console.error('자동 생성 오류:', error);
                this.addChatMessage('자동 프롬프트 생성 중 오류가 발생했습니다.');
            }
        }, 60000);

        this.startCountdown();
        this.addChatMessage(`"${keywords}" 키워드로 1분마다 자동 생성이 시작되었습니다.`);
    }

    stopAutoGeneration() {
        if (this.autoGenerateInterval) {
            clearInterval(this.autoGenerateInterval);
            this.autoGenerateInterval = null;
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        document.getElementById('countdown').textContent = '60초';
        this.countdown = 60;
        this.addChatMessage('자동 생성이 중단되었습니다.');
    }

    startCountdown() {
        this.countdownInterval = setInterval(() => {
            this.countdown--;
            document.getElementById('countdown').textContent = this.countdown;
            
            if (this.countdown <= 0) {
                this.resetCountdown();
            }
        }, 1000);
    }

    resetCountdown() {
        this.countdown = 60;
        document.getElementById('countdown').textContent = this.countdown;
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

const promptGenerator = new PromptGenerator();

window.addEventListener('beforeunload', () => {
    if (promptGenerator.autoGenerateInterval) {
        clearInterval(promptGenerator.autoGenerateInterval);
    }
    if (promptGenerator.countdownInterval) {
        clearInterval(promptGenerator.countdownInterval);
    }
});
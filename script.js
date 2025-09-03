class PromptGenerator {
    constructor() {
        this.prompts = [];
        this.countdown = 60;
        this.autoGenerateInterval = null;
        this.countdownInterval = null;
        this.claudeApiKey = localStorage.getItem('claudeApiKey') || '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupApiKeyInterface();
        this.startAutoGeneration();
        this.addSystemMessage();
    }

    setupEventListeners() {
        const generateBtn = document.getElementById('generateBtn');
        const promptRequest = document.getElementById('promptRequest');

        generateBtn.addEventListener('click', async () => {
            const request = promptRequest.value.trim();
            
            // 로딩 상태 표시
            generateBtn.textContent = '생성 중...';
            generateBtn.disabled = true;
            
            try {
                if (request) {
                    await this.generateCustomPrompt(request);
                    promptRequest.value = '';
                } else {
                    await this.generateRandomPrompt();
                }
            } catch (error) {
                console.error('프롬프트 생성 오류:', error);
                this.addChatMessage('프롬프트 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
            } finally {
                // 로딩 상태 해제
                generateBtn.textContent = '프롬프트 생성';
                generateBtn.disabled = false;
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

    async generateCustomPrompt(request) {
        const aspectRatio = this.getSelectedAspectRatio();
        
        if (!this.claudeApiKey) {
            // 폴백: 기본 번역 시스템 사용
            const translatedRequest = this.translateKoreanToEnglish(request);
            const enhancedPrompt = `Rock-style K-pop girl group like QWER music video scene: ${translatedRequest}, four members with distinct individual styling, alternative fashion with mix of edgy and cute elements, authentic musician vibes with instruments, professional cinematography, dynamic lighting, ultra-detailed, photorealistic, 8K quality, --ar ${aspectRatio} --v 6`;
            
            this.addPromptToHistory(enhancedPrompt, request);
            this.addChatMessage(`"${request}"에 대한 맞춤 프롬프트가 생성되었습니다!`, true);
            
            return enhancedPrompt;
        }

        try {
            const claudePrompt = `Create a detailed Midjourney prompt for a QWER-style K-pop girl group music video based on this user request: "${request}"

Requirements:
- 4-member rock/alternative K-pop girl group like QWER
- Incorporate the user's request creatively into the scene
- Each member should have distinct individual styling and personality
- Include authentic musician elements (instruments, performance aspects)
- Mix of edgy and cute styling elements
- Professional music video quality descriptions
- Specific camera angles and lighting details
- Rich visual descriptions with colors, textures, atmosphere
- If the request is in Korean, interpret it naturally and create an English prompt

Format the response as a complete Midjourney prompt ending with: professional music video quality, ultra-detailed, photorealistic, 8K resolution, --ar ${aspectRatio} --v 6

Generate only the prompt text, no additional explanation.`;

            const aiPrompt = await this.callClaudeAPI(claudePrompt);
            
            this.addPromptToHistory(aiPrompt.trim(), request);
            this.addChatMessage(`AI가 "${request}" 요청을 바탕으로 창의적인 프롬프트를 생성했습니다!`, true);
            
            return aiPrompt.trim();
        } catch (error) {
            console.error('AI 맞춤 프롬프트 생성 실패:', error);
            this.addChatMessage('AI 생성 실패, 기본 번역을 사용합니다.');
            
            // 폴백 처리
            const translatedRequest = this.translateKoreanToEnglish(request);
            const enhancedPrompt = `Rock-style K-pop girl group like QWER music video scene: ${translatedRequest}, four members with distinct individual styling, alternative fashion with mix of edgy and cute elements, authentic musician vibes with instruments, professional cinematography, dynamic lighting, ultra-detailed, photorealistic, 8K quality, --ar ${aspectRatio} --v 6`;
            
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
            aspectRatio: this.getSelectedAspectRatio()
        };

        this.prompts.unshift(historyItem);
        this.renderHistory();
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';

        this.prompts.forEach(item => {
            const historyDiv = document.createElement('div');
            historyDiv.className = 'history-item';
            
            historyDiv.innerHTML = `
                <span class="timestamp">${item.timestamp} | ${item.aspectRatio}</span>
                ${item.originalRequest ? `<div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">요청: "${item.originalRequest}"</div>` : ''}
                <div class="prompt">${item.prompt}</div>
                <button class="copy-btn" onclick="promptGenerator.copyToClipboard('${item.id}')">복사</button>
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

    startAutoGeneration() {
        this.autoGenerateInterval = setInterval(async () => {
            try {
                await this.generateRandomPrompt();
                this.resetCountdown();
            } catch (error) {
                console.error('자동 생성 오류:', error);
                this.addChatMessage('자동 프롬프트 생성 중 오류가 발생했습니다.');
            }
        }, 60000);

        this.startCountdown();
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
class PromptGenerator {
    constructor() {
        this.prompts = [];
        this.countdown = 60;
        this.autoGenerateInterval = null;
        this.countdownInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startAutoGeneration();
        this.addSystemMessage();
    }

    setupEventListeners() {
        const generateBtn = document.getElementById('generateBtn');
        const promptRequest = document.getElementById('promptRequest');

        generateBtn.addEventListener('click', () => {
            const request = promptRequest.value.trim();
            if (request) {
                this.generateCustomPrompt(request);
                promptRequest.value = '';
            } else {
                this.generateRandomPrompt();
            }
        });

        promptRequest.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                generateBtn.click();
            }
        });
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

    generateRandomPrompt() {
        const scenes = [
            'rock-style K-pop girl group performing on stage with electric guitars, bass, and drums in neon-lit underground venue',
            'four-member girl band in edgy streetwear performing choreographed dance routine on rooftop with city skyline',
            'alternative K-pop group with colorful hair in school uniforms playing instruments in abandoned classroom',
            'rock girl group in leather jackets and ripped jeans performing in garage with graffiti walls',
            'indie girl band members with unique fashion styles dancing in retro arcade filled with neon games',
            'alternative K-pop quartet in oversized hoodies and platform boots performing in cyberpunk alley',
            'rock-influenced girl group with bold makeup and accessories performing in warehouse with industrial lighting',
            'four girls in mix-and-match punk-inspired outfits performing synchronized choreography in subway station',
            'alternative girl band in vintage band t-shirts and mini skirts playing on outdoor festival stage',
            'rock-style K-pop group with statement jewelry and boots performing in converted shipping container venue'
        ];

        const styles = [
            'moody dramatic lighting with purple and blue neon accents, sharp contrasts and deep shadows',
            'vibrant pop-punk aesthetic with electric pink, cyan, and yellow color palette, high saturation',
            'cinematic music video style with dynamic camera movements and film grain texture',
            'retro-futuristic vibe with holographic effects, chrome details, and synthwave color scheme',
            'urban streetwear fashion photography style with natural lighting and candid expressions',
            'alternative rock concert atmosphere with smoky haze, stage lights, and energetic crowd',
            'indie film aesthetic with warm analog tones, soft focus, and nostalgic mood',
            'high-contrast black and white with selective color pops in accessories and hair',
            'dreamy surreal atmosphere with floating elements, pastel gradients, and ethereal glow',
            'gritty underground music scene with exposed brick, metal textures, and raw industrial elements'
        ];

        const cameraAngles = [
            'dynamic low angle shot emphasizing power and attitude, tilted composition',
            'close-up portrait shots showcasing individual member personalities and styling',
            'wide establishing shot capturing full group formation and venue atmosphere',
            'tracking shot following dance movements with smooth camera motion',
            'overhead bird\'s eye view showing intricate choreography patterns',
            'handheld documentary style capturing authentic behind-the-scenes energy',
            'split-screen montage showing multiple perspectives simultaneously',
            'macro detail shots of instruments, accessories, and fashion elements',
            'Dutch angle creating visual tension and dynamic composition'
        ];

        const characteristics = [
            'each member has distinct personal style - one in oversized blazer, one in crop top, one in band tee, one in leather jacket',
            'diverse hair colors including platinum blonde, cherry red, midnight blue, and natural black with colored streaks',
            'mix of feminine and androgynous styling with combat boots, chunky sneakers, and statement accessories',
            'authentic musician vibes with members actually holding and playing electric guitars, bass, and drumsticks',
            'confident stage presence with fierce expressions, bold makeup, and powerful body language',
            'youthful energy combined with rebellious attitude, mixing cute and cool elements seamlessly',
            'individual personalities shining through - leader type, cute maknae, cool guitarist, charismatic vocalist',
            'fashion-forward styling mixing high-end pieces with vintage band merch and streetwear brands'
        ];

        const scene = scenes[Math.floor(Math.random() * scenes.length)];
        const style = styles[Math.floor(Math.random() * styles.length)];
        const camera = cameraAngles[Math.floor(Math.random() * cameraAngles.length)];
        const characteristic = characteristics[Math.floor(Math.random() * characteristics.length)];
        const aspectRatio = this.getSelectedAspectRatio();

        const prompt = `${scene}, ${characteristic}, ${style}, ${camera}, professional music video quality, ultra-detailed, photorealistic, 8K resolution, --ar ${aspectRatio} --v 6`;

        this.addPromptToHistory(prompt);
        this.addChatMessage('새로운 랜덤 프롬프트가 생성되었습니다!');
        
        return prompt;
    }

    translateKoreanToEnglish(koreanText) {
        const translations = {
            '네온': 'neon',
            '도시': 'city',
            '밤': 'night',
            '춤': 'dance',
            '노래': 'sing',
            '무대': 'stage',
            '공연': 'performance',
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
            '스튜디오': 'studio'
        };
        
        let englishText = koreanText;
        for (const [korean, english] of Object.entries(translations)) {
            englishText = englishText.replace(new RegExp(korean, 'g'), english);
        }
        
        return englishText;
    }

    generateCustomPrompt(request) {
        const aspectRatio = this.getSelectedAspectRatio();
        const translatedRequest = this.translateKoreanToEnglish(request);
        
        const enhancedPrompt = `Rock-style K-pop girl group like QWER music video scene: ${translatedRequest}, four members with distinct individual styling, alternative fashion with mix of edgy and cute elements, authentic musician vibes with instruments, professional cinematography, dynamic lighting, ultra-detailed, photorealistic, 8K quality, --ar ${aspectRatio} --v 6`;
        
        this.addPromptToHistory(enhancedPrompt, request);
        this.addChatMessage(`"${request}"에 대한 맞춤 프롬프트가 생성되었습니다!`, true);
        
        return enhancedPrompt;
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
        this.autoGenerateInterval = setInterval(() => {
            this.generateRandomPrompt();
            this.resetCountdown();
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
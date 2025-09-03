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
            '화려한 네온사인이 번쩍이는 도시 밤거리에서 걸밴드가 군무를 추는 장면',
            '분홍색과 보라색 조명이 가득한 지하 클럽에서 걸밴드가 공연하는 모습',
            '거대한 LED 스크린 앞에서 메탈릭 의상을 입은 걸밴드가 춤추는 장면',
            '옥상 헬기장에서 석양을 배경으로 걸밴드가 노래하는 드라마틱한 장면',
            '미러볼이 반짝이는 디스코 클럽에서 레트로 의상을 입은 걸밴드의 퍼포먼스',
            '사막의 오아시스에서 화이트 드레스를 입은 걸밴드가 춤추는 환상적인 장면',
            '폐공장에서 그런지 스타일 의상으로 파워풀하게 퍼포먼스하는 걸밴드',
            '수영장 파티에서 비키니와 파레오를 입고 여름 바이브로 노래하는 걸밴드',
            '눈 내리는 겨울 도시에서 퍼 코트를 입고 감성적으로 노래하는 걸밴드',
            '벚꽃이 만개한 공원에서 한복을 현대적으로 재해석한 의상으로 춤추는 걸밴드'
        ];

        const styles = [
            'holographic sparkles and glitter effects',
            'cinematic lighting with dramatic shadows',
            'vibrant neon colors and electric atmosphere',
            'soft pastel tones with dreamy bokeh effects',
            'high fashion editorial style photography',
            'retro 80s synthwave aesthetic',
            'minimalist clean background',
            'explosive colorful paint splashes',
            'ethereal fog and mist effects',
            'geometric patterns and modern architecture'
        ];

        const cameraAngles = [
            'wide shot capturing the full choreography',
            'dynamic low angle shot looking up',
            'overhead bird\'s eye view of the formation',
            'close-up focus on expressive faces',
            'tracking shot following the movement',
            'Dutch angle for dramatic effect',
            'split screen showing multiple perspectives'
        ];

        const moods = [
            'fierce and powerful',
            'elegant and graceful',
            'playful and energetic',
            'mysterious and seductive',
            'fresh and youthful',
            'sophisticated and mature',
            'rebellious and edgy'
        ];

        const scene = scenes[Math.floor(Math.random() * scenes.length)];
        const style = styles[Math.floor(Math.random() * styles.length)];
        const camera = cameraAngles[Math.floor(Math.random() * cameraAngles.length)];
        const mood = moods[Math.floor(Math.random() * moods.length)];
        const aspectRatio = this.getSelectedAspectRatio();

        const prompt = `${scene}, ${style}, ${camera}, ${mood} atmosphere, professional music video quality, 4K resolution, --ar ${aspectRatio} --v 6`;

        this.addPromptToHistory(prompt);
        this.addChatMessage('새로운 랜덤 프롬프트가 생성되었습니다!');
        
        return prompt;
    }

    generateCustomPrompt(request) {
        const aspectRatio = this.getSelectedAspectRatio();
        
        const enhancedPrompt = `K-pop girl group music video scene: ${request}, professional cinematography, dynamic lighting, high fashion styling, vibrant colors, 4K quality, --ar ${aspectRatio} --v 6`;
        
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
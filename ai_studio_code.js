// --- Application State ---
let currentStep = 1;
const totalSteps = 8;

const theoriesData = [
    { id: 't_attention', title: 'Attention', desc: 'How children focus on, filter, and sustain engagement with stimuli.' },
    { id: 't_memory', title: 'Memory', desc: 'How information is encoded, stored, and retrieved over time.' },
    { id: 't_language', title: 'Language Dev.', desc: 'How vocabulary, syntax, and communication skills are modeled and acquired.' },
    { id: 't_social', title: 'Social Learning', desc: 'Learning through observing others\' behaviors, rewards, and consequences.' },
    { id: 't_executive', title: 'Executive Function', desc: 'Cognitive processes like working memory, flexible thinking, and self-control.' },
    { id: 't_emotional', title: 'Emotional Dev.', desc: 'Recognizing, expressing, and managing feelings, as well as empathy.' },
    { id: 't_identity', title: 'Identity / Rep.', desc: 'How media shapes self-concept, gender roles, and understanding of others.' },
    { id: 't_scaffolding', title: 'Scaffolding', desc: 'Support structures in media that help a child reach a higher level of understanding.' },
    { id: 't_cogload', title: 'Cognitive Load', desc: 'The amount of mental effort required to process the visual/audio information.' },
    { id: 't_devapp', title: 'Dev. Appropriateness', desc: 'Matching content pacing, themes, and complexity to the child\'s cognitive stage.' }
];

const feedbackPrompts = [
    "Try naming a specific moment from the media.",
    "Can you connect this idea to a developmental concept?",
    "Focus on what a child is likely to experience, not just your opinion.",
    "This sounds a bit broad. What specific evidence supports it?",
    "Expand slightly: How exactly might a child interpret this?"
];

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    initProgress();
    renderTheoryCards();
    addEvidenceCard(); // Start with one evidence card
    setupCoachingCues();
});

// --- Navigation & Flow ---
function initProgress() {
    const container = document.getElementById('progress-steps');
    for (let i = 2; i <= totalSteps; i++) {
        const step = document.createElement('div');
        step.className = `step-indicator ${i === 2 ? 'active' : ''}`;
        step.id = `ind-${i}`;
        step.innerText = i - 1; // Visual step 1 is actual step 2
        step.title = `Step ${i-1}`;
        container.appendChild(step);
    }
}

function updateProgress(step) {
    if (step === 1) {
        document.getElementById('progress-container').style.display = 'none';
    } else {
        document.getElementById('progress-container').style.display = 'block';
        for (let i = 2; i <= totalSteps; i++) {
            const ind = document.getElementById(`ind-${i}`);
            if (ind) {
                if (i < step) {
                    ind.className = 'step-indicator completed';
                    ind.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                } else if (i === step) {
                    ind.className = 'step-indicator active';
                    ind.innerText = i - 1;
                } else {
                    ind.className = 'step-indicator';
                    ind.innerText = i - 1;
                }
            }
        }
    }
}

function goToStep(step) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');
    updateProgress(step);
    currentStep = step;
    
    // Accessibility: move focus to step heading
    const heading = document.getElementById(`h-step-${step}`);
    if(heading) heading.focus();
    
    // Step specific logic
    if (step === 4) setupWatchStep();
    if (step === 7) setupRevisionStep();
    
    window.scrollTo(0, 0);
}

function nextStep(step) { goToStep(step); }
function prevStep(step) { goToStep(step); }

// --- Specific Flow Handlers ---
function beginAssignment() {
    const presetSel = document.getElementById('preset-media');
    const presetVal = presetSel.value;
    
    if (!presetVal) {
        alert("Please select a media assignment option to begin.");
        presetSel.focus();
        return;
    }

    const urlEl = document.getElementById('yt-url');
    const showEl = document.getElementById('show-title');
    const clipEl = document.getElementById('clip-title');

    if (presetVal !== 'custom') {
        urlEl.value = presetVal;
        const text = presetSel.options[presetSel.selectedIndex].text;
        
        // Basic text splitting to pre-fill fields nicely
        if (text.includes(':')) {
            const parts = text.split(':');
            showEl.value = parts[0].trim();
            clipEl.value = parts[1].trim();
        } else {
            showEl.value = text;
            clipEl.value = "";
        }
    }
    
    nextStep(2);
}

// --- Validations ---
function validateAndNext(current, next) {
    let valid = true;
    if (current === 2) {
        const reqIds = ['show-title', 'yt-url', 'age-group'];
        reqIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el.value.trim()) {
                el.style.borderColor = 'var(--warning)';
                valid = false;
            } else {
                el.style.borderColor = 'var(--border)';
            }
        });
        if(!valid) alert("Please fill in the required fields (marked with *).");
    }
    if (current === 3) {
        // Soft validation for predictions to ensure they aren't totally empty
        const pIds = ['pred-teach', 'pred-attention', 'pred-learn', 'pred-miss'];
        let filled = 0;
        pIds.forEach(id => { if (document.getElementById(id).value.trim().length > 10) filled++; });
        if (filled < 2) {
            valid = confirm("Your predictions seem very short. Are you sure you're ready to proceed to the media experience?");
        }
    }
    if (valid) nextStep(next);
}

function validateWatchAndNext() {
    if (!document.getElementById('watched-confirm').checked) {
        alert("Please check the box confirming you have experienced the media before continuing.");
        return;
    }
    nextStep(5);
}

function validateTheoryAndNext() {
    const checked = document.querySelectorAll('.theory-card input[type="checkbox"]:checked');
    if (checked.length === 0) {
        alert("Please select at least one theory lens.");
        return;
    }
    nextStep(6);
}

// --- Feature: Media/YouTube Logic ---
function extractYouTubeID(url) {
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : null;
}

function setupWatchStep() {
    const url = document.getElementById('yt-url').value.trim();
    const show = document.getElementById('show-title').value.trim() || 'Show Title';
    const clip = document.getElementById('clip-title').value.trim();
    
    document.getElementById('display-show-title').innerText = show;
    document.getElementById('display-clip-title').innerText = clip;

    const ytID = extractYouTubeID(url);
    const imgEl = document.getElementById('yt-thumbnail');
    
    if (ytID) {
        imgEl.src = `https://img.youtube.com/vi/${ytID}/hqdefault.jpg`;
        imgEl.style.display = 'inline-block';
    } else {
        // Failsafe for non-YouTube links (like PBS Kids games)
        imgEl.style.display = 'none';
    }
}

function openMedia() {
    let url = document.getElementById('yt-url').value.trim();
    if(url && !url.startsWith('http')) url = 'https://' + url;
    if(url) window.open(url, '_blank');
}

// --- Feature: Theory Lens ---
function renderTheoryCards() {
    const grid = document.getElementById('theory-grid');
    theoriesData.forEach(t => {
        const card = document.createElement('label');
        card.className = 'theory-card';
        card.innerHTML = `
            <input type="checkbox" value="${t.title}" id="${t.id}" onchange="handleTheorySelection(this)">
            <h4>${t.title}</h4>
            <div class="theory-details">${t.desc}</div>
        `;
        grid.appendChild(card);
    });
}

function handleTheorySelection(checkbox) {
    const checkedBoxes = document.querySelectorAll('.theory-card input[type="checkbox"]:checked');
    if (checkedBoxes.length > 2) {
        checkbox.checked = false;
        alert("Please select a maximum of two lenses to keep your analysis focused.");
        return;
    }
    document.querySelectorAll('.theory-card').forEach(card => {
        const cb = card.querySelector('input');
        if(cb.checked) card.classList.add('selected');
        else card.classList.remove('selected');
    });
}

// --- Feature: Evidence Collection ---
let evidenceCount = 0;
function addEvidenceCard() {
    evidenceCount++;
    const container = document.getElementById('evidence-container');
    const id = `ev-${Date.now()}`;
    
    const card = document.createElement('div');
    card.className = 'evidence-card';
    card.id = id;
    
    card.innerHTML = `
        ${evidenceCount > 1 ? `<button class="remove-evidence" onclick="document.getElementById('${id}').remove()" aria-label="Remove evidence">Remove</button>` : ''}
        
        <div class="form-group">
            <label>Scene / Moment Label</label>
            <input type="text" class="ev-scene" placeholder="e.g., When the puppet drops the block or user clicks..." required>
        </div>
        
        <div class="form-group">
            <label>What happened?</label>
            <textarea class="ev-desc" placeholder="Describe exactly what happens visually and audibly..."></textarea>
        </div>
        
        <fieldset>
            <legend>How does this connect to your prediction?</legend>
            <div class="radio-group">
                <label class="radio-label"><input type="radio" name="ev_status_${id}" value="Supported"> Supported</label>
                <label class="radio-label"><input type="radio" name="ev_status_${id}" value="Complicated"> Complicated</label>
                <label class="radio-label"><input type="radio" name="ev_status_${id}" value="Challenged"> Challenged</label>
            </div>
        </fieldset>
    `;
    container.appendChild(card);
}

// --- Feature: Revision Step ---
const predictionMap = [
    { id: 'pred-teach', label: 'Intended Teaching Goal' },
    { id: 'pred-attention', label: 'Attention Focus' },
    { id: 'pred-learn', label: 'Correct Learning' },
    { id: 'pred-miss', label: 'Misunderstanding / Simplification' }
];

function setupRevisionStep() {
    const container = document.getElementById('revision-container');
    container.innerHTML = ''; // clear previous

    predictionMap.forEach((p, index) => {
        const originalVal = document.getElementById(p.id).value.trim();
        if (!originalVal) return;

        const html = `
            <div class="revision-card">
                <h3>${p.label}</h3>
                <div class="original-pred">" ${originalVal} "</div>
                
                <fieldset>
                    <legend class="sr-only">Evaluation for ${p.label}</legend>
                    <div class="radio-group" style="margin-bottom: 1rem;">
                        <label class="radio-label"><input type="radio" name="rev_stat_${index}" value="Supported"> Supported</label>
                        <label class="radio-label"><input type="radio" name="rev_stat_${index}" value="Partially supported"> Partially Supported</label>
                        <label class="radio-label"><input type="radio" name="rev_stat_${index}" value="Not supported"> Not Supported</label>
                        <label class="radio-label"><input type="radio" name="rev_stat_${index}" value="Needs revision"> Needs Revision</label>
                    </div>
                </fieldset>
                
                <div class="form-group" style="margin-bottom:0;">
                    <label>Brief Explanation of Revision</label>
                    <textarea class="rev-explain" id="rev-explain-${index}" placeholder="Based on the evidence, I now think..."></textarea>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });

    if(container.innerHTML === '') {
        container.innerHTML = '<p><em>No predictions were entered to revise.</em></p>';
    }
}

// --- Feature: Coaching Feedback ---
function setupCoachingCues() {
    document.querySelectorAll('.coached-input').forEach(input => {
        input.addEventListener('blur', function() {
            const val = this.value.trim();
            const cueEl = this.nextElementSibling;
            
            if (val.length > 0 && val.length < 40) {
                const randomCue = feedbackPrompts[Math.floor(Math.random() * feedbackPrompts.length)];
                cueEl.innerText = randomCue;
                cueEl.style.display = 'block';
            } else {
                cueEl.style.display = 'none';
            }
        });
        input.addEventListener('input', function() {
            if(this.value.trim().length > 40) {
                this.nextElementSibling.style.display = 'none';
            }
        });
    });
}

// --- Feature: PNG Export ---
function generateExport() {
    const btn = document.getElementById('btn-export');
    btn.innerText = "Generating...";
    btn.disabled = true;

    // Populate hidden export view
    document.getElementById('ex-show').querySelector('span').innerText = document.getElementById('show-title').value || 'N/A';
    document.getElementById('ex-clip').querySelector('span').innerText = document.getElementById('clip-title').value || 'N/A';
    document.getElementById('ex-url').querySelector('span').innerText = document.getElementById('yt-url').value || 'N/A';
    document.getElementById('ex-age').querySelector('span').innerText = document.getElementById('age-group').value || 'N/A';
    document.getElementById('ex-context').querySelector('span').innerText = document.getElementById('clip-context').value || 'N/A';

    // Revisions
    const revContainer = document.getElementById('ex-revisions-container');
    revContainer.innerHTML = '';
    predictionMap.forEach((p, i) => {
        const orig = document.getElementById(p.id).value.trim();
        if(!orig) return;
        
        let status = 'Not evaluated';
        const statChecked = document.querySelector(`input[name="rev_stat_${i}"]:checked`);
        if(statChecked) status = statChecked.value;
        
        const explainEl = document.getElementById(`rev-explain-${i}`);
        const explain = explainEl ? explainEl.value : '';

        revContainer.innerHTML += `
            <div style="margin-bottom: 20px;">
                <div class="export-q">${p.label}</div>
                <div class="export-a" style="margin-bottom: 8px;"><strong>Initial:</strong> <em>${orig}</em></div>
                <div class="export-a">
                    <span class="export-pill">${status}</span><br>
                    <strong>Revision:</strong> ${explain || 'N/A'}
                </div>
            </div>
        `;
    });

    // Theories
    const selectedTheories = Array.from(document.querySelectorAll('.theory-card input:checked')).map(cb => cb.value);
    document.getElementById('ex-theories').innerHTML = selectedTheories.length > 0 
        ? selectedTheories.map(t => `<span class="export-pill">${t}</span>`).join('') 
        : 'None selected';

    // Evidence
    const evExport = document.getElementById('ex-evidence-container');
    evExport.innerHTML = '';
    document.querySelectorAll('.evidence-card').forEach((card, i) => {
        const scene = card.querySelector('.ev-scene').value || `Evidence ${i+1}`;
        const desc = card.querySelector('.ev-desc').value || 'No description provided.';
        
        let status = 'Unmarked';
        const statChecked = card.querySelector(`input[type="radio"]:checked`);
        if(statChecked) status = statChecked.value;

        evExport.innerHTML += `
            <div class="export-evidence">
                <div class="export-evidence-row"><div class="export-evidence-label">Moment:</div><div>${scene}</div></div>
                <div class="export-evidence-row"><div class="export-evidence-label">Description:</div><div>${desc}</div></div>
                <div class="export-evidence-row"><div class="export-evidence-label">Impact on Claim:</div><div><strong>${status}</strong></div></div>
            </div>
        `;
    });

    // Synthesis
    document.getElementById('ex-takeaway').innerText = document.getElementById('synth-takeaway').value || 'N/A';
    document.getElementById('ex-impact').innerText = document.getElementById('synth-impact').value || 'N/A';
    document.getElementById('ex-limitation').innerText = document.getElementById('synth-limitation').value || 'N/A';
    document.getElementById('ex-effectiveness').innerText = document.getElementById('synth-effectiveness').value || 'N/A';
    document.getElementById('ex-change').innerText = document.getElementById('synth-change').value || 'N/A';

    // Render with html2canvas
    const exportView = document.getElementById('export-view');
    
    html2canvas(exportView, {
        scale: 2, 
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 850
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Prediction_Lab_Analysis.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        btn.innerText = "Export as PNG";
        btn.disabled = false;
    }).catch(err => {
        console.error("Export failed:", err);
        alert("Sorry, an error occurred during export. Please try again.");
        btn.innerText = "Export as PNG";
        btn.disabled = false;
    });
}
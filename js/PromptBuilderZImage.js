import { app } from '../../../scripts/app.js';

let presetsPromise = null;
let presetsData = null;

function loadPresets() {
	if (presetsPromise === null) {
		presetsPromise = fetch('/extensions/ComfyUI-PromptBuilderZImage/presets.json?t=' + Date.now())
			.then(response => response.ok ? response.json() : Promise.reject())
			.then(data => presetsData = data)
			.catch(() => {
				presetsPromise = null;
				return null;
			});
	}

	return presetsPromise;
}

function getPresetValue(category, name) {
	if (!presetsData || !presetsData[category]) {
		return null;
	}

	const items = presetsData[category];

	for (const item of items) {
		if (item.name === name) {
			return item.value;
		}
	}

	return null;
}

function buildPrompt(node) {
	const subjectName = node.widgets.find(w => w.name === 'subject')?.value || '';
	const poseName = node.widgets.find(w => w.name === 'pose')?.value || '';
	const outfitName = node.widgets.find(w => w.name === 'outfit')?.value || '';
	const environmentName = node.widgets.find(w => w.name === 'environment')?.value || '';
	const lightingName = node.widgets.find(w => w.name === 'lighting')?.value || '';
	const compositionName = node.widgets.find(w => w.name === 'composition')?.value || '';
	const styleName = node.widgets.find(w => w.name === 'style')?.value || '';

	const subjectValue = getPresetValue('subject', subjectName);
	const poseValue = getPresetValue('pose', poseName);
	const outfitValue = getPresetValue('outfit', outfitName);
	const environmentValue = getPresetValue('environment', environmentName);
	const lightingValue = getPresetValue('lighting', lightingName);
	const compositionValue = getPresetValue('composition', compositionName);
	const styleValue = getPresetValue('style', styleName);

	return `${subjectValue}, ${poseValue}, ${outfitValue}, ${environmentValue}, ${lightingValue}, ${compositionValue}, ${styleValue}.`;
}

function updatePromptDisplay(node, allowOverwriting) {
	const promptWidget = node.widgets.find(w => w.name === 'prompt_display');

	if (allowOverwriting === false) {
		if (promptWidget && promptWidget.value && promptWidget.value.trim().length > 0) {
			return;
		}
	}

	if (promptWidget) {
		const newPrompt = buildPrompt(node);
		promptWidget.value = newPrompt;
		node.setDirtyCanvas(true, true);
	}
}

app.registerExtension({
	name: 'PromptBuilderZImageNode.AutoUpdate',
	async nodeCreated(node) {
		if (node.comfyClass !== 'PromptBuilderZImageNode') {
			return;
		}

		await loadPresets();

		setTimeout(() => {
			updatePromptDisplay(node, false);

			const observedWidgets = ['subject', 'pose', 'outfit', 'environment', 'lighting', 'composition', 'style'];
			observedWidgets.forEach(widgetName => {
				const widget = node.widgets.find(w => w.name === widgetName);
				if (widget) {
					const origCallback = widget.callback;
					widget.callback = (value) => {
						if (origCallback) {
							origCallback.call(node, value);
						}

						updatePromptDisplay(node, true);
					};
				}
			});
		}, 200);
	}
});

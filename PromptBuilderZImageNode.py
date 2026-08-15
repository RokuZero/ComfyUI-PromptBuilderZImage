import os
import json
import shutil

class PromptBuilderZImageNode:
	RETURN_TYPES = ("STRING",)
	RETURN_NAMES = ("prompt",)
	CATEGORY = "prompt_builder"
	FUNCTION = "process"
	OUTPUT_NODE = True

	@classmethod
	def INPUT_TYPES(cls):
		presets = cls.load_presets()
		categories = ["subject", "pose", "outfit", "environment", "lighting", "composition", "style"]

		widgets = {
			"prompt_display": ("STRING", {"multiline": True, "dynamicPrompts": True}),
		}

		for category in categories:
			items = presets.get(category, [])
			name_values = [item["name"] for item in items]
			widgets[category] = (name_values,)

		return {"required": widgets}

	@classmethod
	def load_presets(cls):
		current_dir = os.path.dirname(os.path.abspath(__file__))
		json_path = os.path.join(current_dir, "js", "presets.json")
		example_path = os.path.join(current_dir, "js", "presets.example.json")

		if not os.path.exists(json_path) and os.path.exists(example_path):
			shutil.copy2(example_path, json_path)

		try:
			with open(json_path, 'r', encoding='utf-8') as f:
				return json.load(f)
		except (FileNotFoundError, json.JSONDecodeError):
			return {}

	def process(self, prompt_display, **kwargs):
		return (prompt_display,)

	@classmethod
	def IS_CHANGED(cls, **kwargs):
		import time
		return time.time()

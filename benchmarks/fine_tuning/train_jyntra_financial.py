# JYNTRA AI — Pipeline de Fine-Tuning Modèle Open-Weight Meta
# Prêt à l'emploi dès que ressources (GPU + poids de modèle) sont disponibles
# Modèles cibles : Muse Spark Open, Muse Glimmer 30B
# Méthode : LoRA / QLoRA
# Domaine : Intelligence financière (SMC, ICT, gestion du risque)

import json
import os
import torch
from datetime import datetime
from pathlib import Path

# ============================================================================
# CONFIGURATION FINE-TUNING
# ============================================================================

FINETUNE_CONFIG = {
    "model_id": "meta-llama/Muse-Spark-Open-30B",  # Remplacer par l'ID officiel quand disponible
    "model_type": "causal_lm",
    "method": "qlora",  # ou "lora"
    "dataset_path": "benchmarks/dataset/jyntra-financial-v1.jsonl",
    "output_dir": "models/jyntra-financial-v1",
    
    # Hyperparamètres LoRA/QLoRA
    "lora_r": 16,
    "lora_alpha": 32,
    "lora_dropout": 0.05,
    "lora_target_modules": ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    
    # Entraînement
    "learning_rate": 2e-4,
    "batch_size": 1,
    "gradient_accumulation_steps": 16,
    "num_epochs": 3,
    "max_seq_length": 2048,
    "warmup_steps": 10,
    "logging_steps": 5,
    "save_steps": 50,
    "eval_steps": 50,
    
    # Optimisation
    "fp16": False,
    "bf16": True,  # Recommandé sur GPU récent
    "gradient_checkpointing": True,
    "optim": "paged_adamw_32bit",
    
    # Meta spécifiques
    "trust_remote_code": True,
    "use_fast_tokenizer": True,
}

# ============================================================================
# PIPELINE D'ENTRAÎNEMENT
# ============================================================================

def load_model_and_tokenizer(model_id: str):
    """
    Charge le modèle et le tokenizer pour fine-tuning.
    Nécessite : transformers, peft, bitsandbytes, accelerate
    """
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    
    # Quantification 4-bit pour QLoRA
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
    )
    
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    
    tokenizer = AutoTokenizer.from_pretrained(
        model_id,
        trust_remote_code=True,
        use_fast=True,
    )
    tokenizer.pad_token = tokenizer.eos_token
    
    # Préparation pour k-bit training
    model = prepare_model_for_kbit_training(model)
    
    # Configuration LoRA
    lora_config = LoraConfig(
        r=FINETUNE_CONFIG["lora_r"],
        lora_alpha=FINETUNE_CONFIG["lora_alpha"],
        lora_dropout=FINETUNE_CONFIG["lora_dropout"],
        target_modules=FINETUNE_CONFIG["lora_target_modules"],
        bias="none",
        task_type="CAUSAL_LM",
    )
    
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    return model, tokenizer


def load_dataset(dataset_path: str):
    """
    Charge le dataset JSONL pour fine-tuning.
    """
    from datasets import Dataset
    
    data = []
    with open(dataset_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                data.append(json.loads(line))
    
    return Dataset.from_list(data)


def format_training_example(example: dict) -> str:
    """
    Formate un exemple d'instruction pour l'entraînement.
    Format : <|system|>...<|user|>...<|assistant|>...
    """
    system_prompt = "Tu es JYNTRA AI, un expert en analyse financière et trading. Réponds en français de manière précise et professionnelle."
    
    formatted = f"<|system|>{system_prompt}</|system|>\n"
    formatted += f"<|user|>{example['instruction']}\n{example.get('input', '')}</|user|>\n"
    formatted += f"<|assistant|>{example['output']}</|assistant|>"
    
    return formatted


def tokenize_dataset(dataset, tokenizer, max_length: int = 2048):
    """
    Tokenise le dataset pour l'entraînement.
    """
    def tokenize_function(examples):
        texts = [format_training_example(ex) for ex in examples]
        return tokenizer(
            texts,
            truncation=True,
            max_length=max_length,
            padding="max_length",
            return_tensors="pt",
        )
    
    return dataset.map(tokenize_function, batched=True, remove_columns=dataset.column_names)


def train():
    """
    Point d'entrée principal de l'entraînement.
    """
    print("=" * 60)
    print("JYNTRA AI — Fine-Tuning Modèle Open-Weight Meta")
    print("=" * 60)
    
    # Vérification des ressources
    if not torch.cuda.is_available():
        print("ATTENTION : Aucun GPU détecté. L'entraînement sur CPU sera extrêmement lent.")
        print("Recommandation : utiliser un GPU avec au moins 24GB VRAM pour QLoRA 30B.")
    
    print(f"PyTorch version : {torch.__version__}")
    print(f"CUDA disponible : {torch.cuda.is_available()}")
    
    # Chargement du modèle
    print("\n[1/4] Chargement du modèle et du tokenizer...")
    model, tokenizer = load_model_and_tokenizer(FINETUNE_CONFIG["model_id"])
    
    # Chargement du dataset
    print("\n[2/4] Chargement du dataset...")
    dataset = load_dataset(FINETUNE_CONFIG["dataset_path"])
    print(f"Nombre d'exemples : {len(dataset)}")
    
    # Tokenisation
    print("\n[3/4] Tokenisation du dataset...")
    tokenized_dataset = tokenize_dataset(dataset, tokenizer, FINETUNE_CONFIG["max_seq_length"])
    
    # Entraînement
    print("\n[4/4] Démarrage de l'entraînement...")
    from transformers import TrainingArguments, Trainer
    
    training_args = TrainingArguments(
        output_dir=FINETUNE_CONFIG["output_dir"],
        per_device_train_batch_size=FINETUNE_CONFIG["batch_size"],
        gradient_accumulation_steps=FINETUNE_CONFIG["gradient_accumulation_steps"],
        num_train_epochs=FINETUNE_CONFIG["num_epochs"],
        learning_rate=FINETUNE_CONFIG["learning_rate"],
        warmup_steps=FINETUNE_CONFIG["warmup_steps"],
        logging_steps=FINETUNE_CONFIG["logging_steps"],
        save_steps=FINETUNE_CONFIG["save_steps"],
        eval_steps=FINETUNE_CONFIG["eval_steps"],
        fp16=FINETUNE_CONFIG["fp16"],
        bf16=FINETUNE_CONFIG["bf16"],
        gradient_checkpointing=FINETUNE_CONFIG["gradient_checkpointing"],
        optim=FINETUNE_CONFIG["optim"],
        logging_dir="./logs",
        report_to="none",
        save_total_limit=2,
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
        tokenizer=tokenizer,
    )
    
    trainer.train()
    
    # Sauvegarde
    print("\n[5/4] Sauvegarde du modèle adapté...")
    model.save_pretrained(FINETUNE_CONFIG["output_dir"])
    tokenizer.save_pretrained(FINETUNE_CONFIG["output_dir"])
    
    # Sauvegarde de la configuration
    with open(os.path.join(FINETUNE_CONFIG["output_dir"], "finetune_config.json"), "w") as f:
        json.dump(FINETUNE_CONFIG, f, indent=2, ensure_ascii=False)
    
    print(f"\nModèle adapté sauvegardé dans : {FINETUNE_CONFIG['output_dir']}")
    print("Fine-tuning terminé avec succès.")


if __name__ == "__main__":
    train()
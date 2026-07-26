// =========================================
// automata/RegexParser.js
// Convertisseur d'Expressions Régulières (Infix -> Postfix)
// =========================================

class RegexParser {
    
    // 1. Rend la concaténation explicite en insérant un point '.'
    static insertExplicitConcat(exp) {
        let result = "";
        for (let i = 0; i < exp.length; i++) {
            let c1 = exp[i];
            result += c1;
            
            if (i + 1 < exp.length) {
                let c2 = exp[i + 1];
                
                // On insère une concaténation '.' si :
                // c1 est une lettre, un '*', ou ')'
                // ET c2 est une lettre ou '('
                let isC1Alpha = /[a-zA-Z0-9]/.test(c1);
                let isC2Alpha = /[a-zA-Z0-9]/.test(c2);

                if ((isC1Alpha || c1 === ')' || c1 === '*') && 
                    (isC2Alpha || c2 === '(')) {
                    result += '.';
                }
            }
        }
        return result;
    }

    // 2. Convertit la chaîne (avec concaténation explicite) en Postfix
    static toPostfix(exp) {
        let output = "";
        let stack = [];
        
        // Définition des priorités des opérateurs
        const precedence = {
            '|': 1, // Union (priorité la plus faible)
            '.': 2, // Concaténation
            '*': 3  // Étoile de Kleene (priorité la plus forte)
        };

        // On commence par ajouter les points '.' invisibles
        exp = this.insertExplicitConcat(exp);

        for (let i = 0; i < exp.length; i++) {
            let c = exp[i];

            if (/[a-zA-Z0-9]/.test(c)) {
                // Si c'est une lettre (opérande), on l'ajoute direct à la sortie
                output += c;
            } 
            else if (c === '(') {
                // Parenthèse ouvrante va sur la pile
                stack.push(c);
            } 
            else if (c === ')') {
                // Parenthèse fermante : on dépile jusqu'à la parenthèse ouvrante
                while (stack.length > 0 && stack[stack.length - 1] !== '(') {
                    output += stack.pop();
                }
                stack.pop(); // On retire le '(' de la pile
            } 
            else {
                // C'est un opérateur (*, ., |)
                while (stack.length > 0 && 
                       stack[stack.length - 1] !== '(' && 
                       precedence[stack[stack.length - 1]] >= precedence[c]) {
                    output += stack.pop();
                }
                stack.push(c);
            }
        }

        // On vide ce qu'il reste sur la pile
        while (stack.length > 0) {
            output += stack.pop();
        }

        return output;
    }
}
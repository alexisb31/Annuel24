const form = document.querySelector('form');
form.addEventListener('submit', function(e) {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Vérifier que le mot de passe et la confirmation du mot de passe sont identiques
    if (password !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        e.preventDefault();
        return;
    }

    // Vérifier que le mot de passe a une longueur minimale
    if (password.length < 8) {
        alert('Le mot de passe doit comporter au moins 8 caractères');
        e.preventDefault();
        return;
    }

    // Vérifier que le mot de passe contient une combinaison de lettres, de chiffres et de caractères spéciaux
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[\W]/.test(password)) {
        alert('Le mot de passe doit contenir une combinaison de lettres majuscules et minuscules, de chiffres et de caractères spéciaux');
        e.preventDefault();
        return;
    }

    
});
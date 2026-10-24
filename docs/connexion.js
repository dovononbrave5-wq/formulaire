const formulaire_connexion = document.getElementById("formulaire-connexion");
formulaire_connexion.addEventListener("submit",async function(event){
    event.preventDefault();
    const email=document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const motDePasseCorrect = await bcrypt.compare(password,utilisateur.passwordHash)
    //const hash = await bcrypt.hash(password, 10);     
    const result = await verifyPassword(password, hash);  
    if (result) {
        //email verification        
        document.getElementById("resultat").textContent ="Adresse e-mail invalide !";
    }else if (is_Verified===0) {
        //mot de passe verification
        document.getElementById("resultat").textContent ="Authentification echouer, Verifier votre compte";
    } else if(!motDePasseCorrect){
        document.getElementById("resultat").textContent = "Les mots de passe incorrecte!";
    }// else{
    //     document.getElementById("resultat").textContent = "Verification faite";
    // }
})
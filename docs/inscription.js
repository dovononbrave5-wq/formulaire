const formulaire_inscription = document.getElementById("formulaire");
formulaire_inscription.addEventListener("submit",async function(event){
    event.preventDefault();
    const email=document.getElementById("email").value;
    const regex_email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    const confirm_password = document.getElementById("confirm-password").value;
    const regex_password =/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;        const password = document.getElementById("password").value;      
    //const hash = await bcrypt.hash(password, 10);       
    if (!regex_email.test(email)) {
        //email verification        
        document.getElementById("resultat").textContent ="Adresse e-mail invalide !";
    }else if (!regex_password.test(password)) {
        //mot de passe verification
        document.getElementById("resultat").textContent ="Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.";
    } else if(password !=confirm_password){
        document.getElementById("resultat").textContent = "Les mots de passe ne correspondent pas !";
    }// else{
    //     document.getElementById("resultat").textContent = "Verification faite";
    // }
})

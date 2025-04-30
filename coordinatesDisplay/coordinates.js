async function displayMap() {
    const startTime = performance.now(); // Pour mesurer le temps d'exécution
    
    try {
        // 1. Obtenir la largeur de la carte
        const mapWidth = await getMapWidth();
        
        // 2. Créer la grille
        createGrid(mapWidth);
        
        // 3. Créer un tableau de promesses pour toutes les pièces
        const piecePromises = [];
        const totalPieces = mapWidth * mapWidth;
        
        for (let i = 0; i < totalPieces; i++) {
            piecePromises.push(getMapPiece(i));
        }
        
        // 4. Attendre que toutes les pièces soient récupérées
        const pieces = await Promise.all(piecePromises);
        
        // 5. Afficher toutes les pièces
        const displayPromises = pieces.map(piece => {
            return displayPiece(piece.svg, piece.x, piece.y);
        });
        
        await Promise.all(displayPromises);
        
        // 6. Calculer le temps écoulé
        const endTime = performance.now();
        return endTime - startTime;
        
    } catch (error) {
        // En cas d'erreur, rejeter la promesse avec l'erreur originale
        throw error;
    }
}

#include "graph.h"    // Inclusion du fichier d'en-tête contenant les structures et prototypes
#include <string.h>   // Pour utiliser les fonctions de manipulation de chaînes (strdup)

// Fonction qui crée et initialise un nouveau graphe
Graphe* creer_graphe() {
    Graphe* g = (Graphe*)malloc(sizeof(Graphe));  // Allocation dynamique pour la structure du graphe
    g->taille = 0;      // Initialisation du nombre de sommets à 0
    g->capacite = 10;   // Définition de la capacité initiale (10 sommets)
    g->sommets = (Sommet*)malloc(g->capacite * sizeof(Sommet));  // Allocation du tableau de sommets
    return g;           // Retourne le pointeur vers le nouveau graphe
}

// Fonction qui ajoute un nouveau sommet au graphe
void ajouter_sommet(Graphe* g, const char* nom){
    // Si le tableau est plein, on double sa capacité
    if (g->taille == g->capacite){
        g->capacite *= 2;  // Double la capacité
        // Réallocation du tableau avec la nouvelle taille
        g->sommets = (Sommet*)realloc(g->sommets, g->capacite * sizeof(Sommet));
    }
    // Copie le nom du sommet (strdup fait malloc + strcpy)
    g->sommets[g->taille].nom = strdup(nom);
    g->sommets[g->taille].aretes = NULL;  // Initialise la liste d'arêtes à vide
    g->taille++;  // Incrémente le nombre de sommets
}

// Fonction qui ajoute une arête entre deux sommets
void ajouter_arete(Graphe* g, const char* src, const char* dest, int poids){
    // TODO: Implémenter l'ajout d'arête
    // Trouver l'indice du sommet source    
}

// Fonction qui libère toute la mémoire utilisée par le graphe
void liberer_graphe(Graphe* g){
    // Parcourt tous les sommets
    for(int i = 0; i < g->taille; i++){
        free(g->sommets[i].nom);  // Libère la mémoire du nom du sommet
        Arete* arete = g->sommets[i].aretes;  // Récupère la liste des arêtes
    
        // Libère toutes les arêtes du sommet
        while(arete != NULL){
            Arete* temp = arete;          // Sauvegarde l'arête courante
            arete = arete->suivante;      // Passe à l'arête suivante
            free(temp);                   // Libère l'arête sauvegardée
        }
    }
    free(g->sommets);  // Libère le tableau des sommets
    free(g);           // Libère la structure du graphe
}
// Guards pour éviter les inclusions multiples du header
#ifndef Graphe_H
#define Graphe_H

#include <stdlib.h>  // Pour utiliser malloc, free, etc.

// Structure représentant une arête du graphe
// Une arête relie deux sommets avec un certain poids (distance)
typedef struct Arete {
    int dest;                // Index du sommet de destination
    int poids;              // Poids/distance de l'arête
    struct Arete* suivante; // Pointeur vers l'arête suivante (liste chaînée)
}Arete;

// Structure représentant un sommet du graphe
// Chaque sommet a un nom et une liste d'arêtes
typedef struct Sommet {
    char* nom;      // Nom du sommet (ville)
    Arete* aretes;  // Liste chaînée des arêtes partant de ce sommet
}Sommet;

// Structure principale du graphe
// Contient un tableau dynamique de sommets
typedef struct Gaphe {
    Sommet* sommets;  // Tableau dynamique des sommets
    int taille;       // Nombre actuel de sommets
    int capacite;     // Capacité totale du tableau (pour la gestion dynamique)
}Graphe;

// Prototypes des fonctions

// Crée et initialise un nouveau graphe vide
Graphe* creer_graphe();

// Ajoute un nouveau sommet au graphe avec le nom spécifié
void ajouter_sommet(Graphe* g, const char* nom);

// Ajoute une arête entre deux sommets existants avec un poids donné
void ajouter_arete(Graphe* g, const char* src, const char* dest, int poids);

// Libère toute la mémoire utilisée par le graphe
void liberer_graphe(Graphe* g);

#endif // Graphe_H
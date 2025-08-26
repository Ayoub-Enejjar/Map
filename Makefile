CC = gcc
CFLAGS = -Wall -Wextra -g
SRC = src/graphe.c src/dijkstra.c src/main.c
OBJ = $(SRC:.c=.o)
EXEC = dijkstra_avance

all: $(EXEC)

$(EXEC): $(OBJ)
	$(CC) $(CFLAGS) $^ -o $@

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJ) $(EXEC) 
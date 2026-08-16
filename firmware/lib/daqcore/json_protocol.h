#ifndef DAQCORE_JSON_PROTOCOL_H
#define DAQCORE_JSON_PROTOCOL_H

#include <stdint.h>
#include <stddef.h>

// Pacote de escrita / comando recebido do RPi
struct Command {
  uint8_t sv1, sv2, sv3, sv4, sv5;
  uint8_t pump;
  uint8_t pwm_u;
  uint8_t pwm_f2;
  bool valid;      // true se for um pacote de escrita válido
  bool is_config;  // true se for o handshake de parametrização
};

// Pacote de leitura / relatório enviado ao RPi
struct Report {
  float t1;
  float t2;
  const char* status;  // "active" | "safe"
  int error_code;
};

// Retorna true se o buffer contém um pacote válido (escrita ou config).
// Pacote de escrita preenche cmd com cmd.valid = true.
// Handshake de config preenche cmd.is_config = true (não altera atuadores).
bool parseIncoming(const char* buf, Command& cmd);

// Serializa o relatório de leitura como JSON line-delimited em `out`.
void buildReport(const Report& rep, char* out, size_t cap);

#endif  // DAQCORE_JSON_PROTOCOL_H

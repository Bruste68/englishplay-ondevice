#include "grammar-parser.h"
#include <cstdint>
#include <cwchar>
#include <string>
#include <utility>
#include <stdexcept>
#include <exception>

namespace grammar_parser {
    // NOTE: assumes valid utf8 (but checks for overrun)
    // copied from whisper.cpp
    static std::pair<uint32_t, const char *> decode_utf8(const char * src) {
        static const int lookup[] = { 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4 };
        uint8_t  first_byte = static_cast<uint8_t>(*src);
        uint8_t  highbits   = first_byte >> 4;
        int      len        = lookup[highbits];
        uint8_t  mask       = (1 << (8 - len)) - 1;
        uint32_t value      = first_byte & mask;
        const char * end    = src + len; // may overrun!
        const char * pos    = src + 1;
        for ( ; pos < end && *pos; pos++) {
            value = (value << 6) + (static_cast<uint8_t>(*pos) & 0x3F);
        }
        return std::make_pair(value, pos);
    }

    static uint32_t get_symbol_id(parse_state & state, const char * src, size_t len) {
        uint32_t next_id = static_cast<uint32_t>(state.symbol_ids.size());
        auto result = state.symbol_ids.insert(std::make_pair(std::string(src, len), next_id));
        return result.first->second;
    }

    static uint32_t generate_symbol_id(parse_state & state, const std::string & base_name) {
        uint32_t next_id = static_cast<uint32_t>(state.symbol_ids.size());
        state.symbol_ids[base_name + '_' + std::to_string(next_id)] = next_id;
        return next_id;
    }

    static void add_rule(
            parse_state & state,
            uint32_t      rule_id,
            const std::vector<whisper_grammar_element> & rule) {
        if (state.rules.size() <= rule_id) {
            state.rules.resize(rule_id + 1);
        }
        state.rules[rule_id] = rule;
    }

    static bool is_word_char(char c) {
        return ('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z') || c == '-' || ('0' <= c && c <= '9');
    }

    static std::pair<uint32_t, const char *> parse_hex(const char * src, int size) {
        const char * pos   = src;
        const char * end   = src + size;
        uint32_t     value = 0;
        for ( ; pos < end && *pos; pos++) {
            value <<= 4;
            char c = *pos;
            if ('a' <= c && c <= 'f') {
                value += c - 'a' + 10;
            } else if ('A' <= c && c <= 'F') {
                value += c - 'A' + 10;
            } else if ('0' <= c && c <= '9') {
                value += c - '0';
            } else {
                break;
            }
        }
        if (pos != end) {
            throw std::runtime_error("expecting " + std::to_string(size) + " hex chars at " + src);
        }
        return std::make_pair(value, pos);
    }

    static const char * parse_space(const char * src, bool newline_ok) {
        const char * pos = src;
        while (*pos == ' ' || *pos == '\t' || *pos == '#' ||
                (newline_ok && (*pos == '\r' || *pos == '\n'))) {
            if (*pos == '#') {
                while (*pos && *pos != '\r' && *pos != '\n') {
                    pos++;
                }
            } else {
                pos++;
            }
        }
        return pos;
    }

    static const char * parse_name(const char * src) {
        const char * pos = src;
        while (is_word_char(*pos)) {
            pos++;
        }
        if (pos == src) {
            throw std::runtime_error(std::string("expecting name at ") + src);
        }
        return pos;
    }

    static std::pair<uint32_t, const char *> parse_char(const char * src) {
        if (*src == '\\') {
            switch (src[1]) {
                case 'x': return parse_hex(src + 2, 2);
                case 'u': return parse_hex(src + 2, 4);
                case 'U': return parse_hex(src + 2, 8);
                case 't': return std::make_pair('\t', src + 2);
                case 'r': return std::make_pair('\r', src + 2);
                case 'n': return std::make_pair('\n', src + 2);
                case '\\':
                case '"':
                case '[':
                case ']':
                    return std::make_pair(src[1], src + 2);
                default:
                    throw std::runtime_error(std::string("unknown escape at ") + src);
            }
        } else if (*src) {
            return decode_utf8(src);
        }
        throw std::runtime_error("unexpected end of input");
    }

    static const char * parse_alternates(
            parse_state       & state,
            const char        * src,
            const std::string & rule_name,
            uint32_t            rule_id,
            bool                is_nested);

    static const char * parse_sequence(
            parse_state                        & state,
            const char                         * src,
            const std::string                  & rule_name,
            std::vector<whisper_grammar_element> & out_elements,
            bool                                 is_nested) {
        size_t last_sym_start = out_elements.size();
        const char * pos = src;
        while (*pos) {
            if (*pos == '"') { // literal string
                pos++;
                last_sym_start = out_elements.size();
                while (*pos != '"') {
                    auto char_pair = parse_char(pos);
                         pos       = char_pair.second;
                    out_elements.push_back({WHISPER_GRETYPE_CHAR, char_pair.first});
                }
                pos = parse_space(pos + 1, is_nested);
            } else if (*pos == '[') { // char range(s)
                pos++;
                enum whisper_gretype start_type = WHISPER_GRETYPE_CHAR;
                if (*pos == '^') {
                    pos++;
                    start_type = WHISPER_GRETYPE_CHAR_NOT;
                }
                last_sym_start = out_elements.size();
                while (*pos != ']') {
                    auto char_pair = parse_char(pos);
                         pos       = char_pair.second;
                    enum whisper_gretype type = last_sym_start < out_elements.size()
                        ? WHISPER_GRETYPE_CHAR_ALT
                        : start_type;

                    out_elements.push_back({type, char_pair.first});
                    if (pos[0] == '-' && pos[1] != ']') {
                        auto endchar_pair = parse_char(pos + 1);
                             pos          = endchar_pair.second;
                        out_elements.push_back({WHISPER_GRETYPE_CHAR_RNG_UPPER, endchar_pair.first});
                    }
                }
                pos = parse_space(pos + 1, is_nested);
            } else if (is_word_char(*pos)) { // rule reference
                const char * name_end    = parse_name(pos);
                uint32_t     ref_rule_id = get_symbol_id(state, pos, name_end - pos);
                pos = parse_space(name_end, is_nested);
                last_sym_start = out_elements.size();
                out_elements.push_back({WHISPER_GRETYPE_RULE_REF, ref_rule_id});
            } else if (*pos == '(') { // grouping
                // parse nested alternates into synthesized rule
                pos = parse_space(pos + 1, true);
                uint32_t sub_rule_id = generate_symbol_id(state, rule_name);
                pos = parse_alternates(state, pos, rule_name, sub_rule_id, true);
                last_sym_start = out_elements.size();
                // output reference to synthesized rule
                out_elements.push_back({WHISPER_GRETYPE_RULE_REF, sub_rule_id});
                if (*pos != ')') {
                    throw std::runtime_error(std::string("expecting ')' at ") + pos);
                }
                pos = parse_space(pos + 1, is_nested);
            } else if (*pos == '*' || *pos == '+' || *pos == '?') { // repetition operator
                if (last_sym_start == out_elements.size()) {
                    throw std::runtime_error(std::string("expecting preceding item to */+/? at ") + pos);
                }

                // apply transformation to previous symbol (last_sym_start to end) according to
                // rewrite rules:
                // S* --> S' ::= S S' |
                // S+ --> S' ::= S S' | S
                // S? --> S' ::= S |
                uint32_t sub_rule_id = generate_symbol_id(state, rule_name);
                std::vector<whisper_grammar_element> sub_rule;
                // add preceding symbol to generated rule
                sub_rule.insert(
                    sub_rule.end(), out_elements.begin() + last_sym_start, out_elements.end());
                if (*pos == '*' || *pos == '+') {
                    // cause generated rule to recurse
                    sub_rule.push_back({WHISPER_GRETYPE_RULE_REF, sub_rule_id});
                }
                // mark start of alternate def
                sub_rule.push_back({WHISPER_GRETYPE_ALT, 0});
                if (*pos == '+') {
                    // add preceding symbol as alternate only for '+' (otherwise empty)
                    sub_rule.insert(
                        sub_rule.end(), out_elements.begin() + last_sym_start, out_elements.end());
                }
                sub_rule.push_back({WHISPER_GRETYPE_END, 0});
                add_rule(state, sub_rule_id, sub_rule);

                // in original rule, replace previous symbol with reference to generated rule
                out_elements.resize(last_sym_start);
                out_elements.push_back({WHISPER_GRETYPE_RULE_REF, sub_rule_id});

                pos = parse_space(pos + 1, is_nested);
            } else {
                break;
            }
        }
        return pos;
    }

    static const char * parse_alternates(
            parse_state       & state,
            const char        * src,
            const std::string & rule_name,
            uint32_t            rule_id,
            bool                is_nested) {
        std::vector<whisper_grammar_element> rule;
        const char * pos = parse_sequence(state, src, rule_name, rule, is_nested);
        while (*pos == '|') {
            rule.push_back({WHISPER_GRETYPE_ALT, 0});
            pos = parse_space(pos + 1, true);
            pos = parse_sequence(state, pos, rule_name, rule, is_nested);
        }
        rule.push_back({WHISPER_GRETYPE_END, 0});
        add_rule(state, rule_id, rule);
        return pos;
    }

    static const char * parse_rule(parse_state & state, const char * src) {
        const char * name_end = parse_name(src);
        const char * pos      = parse_space(name_end, false);
        size_t       name_len = name_end - src;
        uint32_t     rule_id  = get_symbol_id(state, src, name_len);
        const std::string name(src, name_len);

        if (!(pos[0] == ':' && pos[1] == ':' && pos[2] == '=')) {
            throw std::runtime_error(std::string("expecting ::= at ") + pos);
        }
        pos = parse_space(pos + 3, true);

        pos = parse_alternates(state, pos, name, rule_id, false);

        if (*pos == '\r') {
            pos += pos[1] == '\n' ? 2 : 1;
        } else if (*pos == '\n') {
            pos++;
        } else if (*pos) {
            throw std::runtime_error(std::string("expecting newline or end at ") + pos);
        }
        return parse_space(pos, true);
    }

    parse_state parse(const char * src) {
        try {
            parse_state state;
            const char * pos = parse_space(src, true);
            while (*pos) {
                pos = parse_rule(state, pos);
            }
            return state;
        } catch (const std::exception & err) {
            fprintf(stderr, "%s: error parsing grammar: %s\n", __func__, err.what());
            return parse_state();
        }
    }

    static void print_grammar_char(FILE * file, uint32_t c) {
        if (0x20 <= c && c <= 0x7f) {
            fprintf(file, "%c", static_cast<char>(c));
        } else {
            // cop out of encoding UTF-8
            fprintf(file, "<U+%04X>", c);
        }
    }

    static bool is_char_element(whisper_grammar_element elem) {
        switch (elem.type) {
            case WHISPER_GRETYPE_CHAR:           return true;
            case WHISPER_GRETYPE_CHAR_NOT:       return true;
            case WHISPER_GRETYPE_CHAR_ALT:       return true;
            case WHISPER_GRETYPE_CHAR_RNG_UPPER: return true;
            default:                           return false;
        }
    }

    static void print_rule_binary(FILE * file, const std::vector<whisper_grammar_element> & rule) {
        for (auto elem : rule) {
            switch (elem.type) {
                case WHISPER_GRETYPE_END:            fprintf(file, "END");            break;
                case WHISPER_GRETYPE_ALT:            fprintf(file, "ALT");            break;
                case WHISPER_GRETYPE_RULE_REF:       fprintf(file, "RULE_REF");       break;
                case WHISPER_GRETYPE_CHAR:           fprintf(file, "CHAR");           break;
                case WHISPER_GRETYPE_CHAR_NOT:       fprintf(file, "CHAR_NOT");       break;
                case WHISPER_GRETYPE_CHAR_RNG_UPPER: fprintf(file, "CHAR_RNG_UPPER"); break;
                case WHISPER_GRETYPE_CHAR_ALT:       fprintf(file, "CHAR_ALT");       break;
            }
            switch (elem.type) {
                case WHISPER_GRETYPE_END:
                case WHISPER_GRETYPE_ALT:
                case WHISPER_GRETYPE_RULE_REF:
                    fprintf(file, "(%u) ", elem.value);
                    break;
                case WHISPER_GRETYPE_CHAR:
                case WHISPER_GRETYPE_CHAR_NOT:
                case WHISPER_GRETYPE_CHAR_RNG_UPPER:
                case WHISPER_GRETYPE_CHAR_ALT:
                    fprintf(file, "(\"");
                    print_grammar_char(file, elem.value);
                    fprintf(file, "\") ");
                    break;
            }
        }
        fprintf(file, "\n");
    }

    static void print_rule(
            FILE     * file,
            uint32_t   rule_id,
            const std::vector<whisper_grammar_element> & rule,
            const std::map<uint32_t, std::string>    & symbol_id_names) {
        if (rule.empty() || rule.back().type != WHISPER_GRETYPE_END) {
            throw std::runtime_error(
                "malformed rule, does not end with WHISPER_GRETYPE_END: " + std::to_string(rule_id));
        }
        fprintf(file, "%s ::= ", symbol_id_names.at(rule_id).c_str());
        for (size_t i = 0, end = rule.size() - 1; i < end; i++) {
            whisper_grammar_element elem = rule[i];
            switch (elem.type) {
                case WHISPER_GRETYPE_END:
                    throw std::runtime_error(
                        "unexpected end of rule: " + std::to_string(rule_id) + "," +
                        std::to_string(i));
                case WHISPER_GRETYPE_ALT:
                    fprintf(file, "| ");
                    break;
                case WHISPER_GRETYPE_RULE_REF:
                    fprintf(file, "%s ", symbol_id_names.at(elem.value).c_str());
                    break;
                case WHISPER_GRETYPE_CHAR:
                    fprintf(file, "[");
                    print_grammar_char(file, elem.value);
                    break;
                case WHISPER_GRETYPE_CHAR_NOT:
                    fprintf(file, "[^");
                    print_grammar_char(file, elem.value);
                    break;
                case WHISPER_GRETYPE_CHAR_RNG_UPPER:
                    if (i == 0 || !is_char_element(rule[i - 1])) {
                        throw std::runtime_error(
                            "WHISPER_GRETYPE_CHAR_RNG_UPPER without preceding char: " +
                            std::to_string(rule_id) + "," + std::to_string(i));
                    }
                    fprintf(file, "-");
                    print_grammar_char(file, elem.value);
                    break;
                case WHISPER_GRETYPE_CHAR_ALT:
                    if (i == 0 || !is_char_element(rule[i - 1])) {
                        throw std::runtime_error(
                            "WHISPER_GRETYPE_CHAR_ALT without preceding char: " +
                            std::to_string(rule_id) + "," + std::to_string(i));
                    }
                    print_grammar_char(file, elem.value);
                    break;
            }
            if (is_char_element(elem)) {
                switch (rule[i + 1].type) {
                    case WHISPER_GRETYPE_CHAR_ALT:
                    case WHISPER_GRETYPE_CHAR_RNG_UPPER:
                        break;
                    default:
                        fprintf(file, "] ");
                }
            }
        }
        fprintf(file, "\n");
    }

    void print_grammar(FILE * file, const parse_state & state) {
        try {
            std::map<uint32_t, std::string> symbol_id_names;
            for (auto kv : state.symbol_ids) {
                symbol_id_names[kv.second] = kv.first;
            }
            for (size_t i = 0, end = state.rules.size(); i < end; i++) {
                // fprintf(file, "%zu: ", i);
                // print_rule_binary(file, state.rules[i]);
                print_rule(file, uint32_t(i), state.rules[i], symbol_id_names);
                // fprintf(file, "\n");
            }
        } catch (const std::exception & err) {
            fprintf(stderr, "\n%s: error printing grammar: %s\n", __func__, err.what());
        }
    }

    std::vector<const whisper_grammar_element *> parse_state::c_rules() const {
        std::vector<const whisper_grammar_element *> ret;
        for (const auto & rule : rules) {
            ret.push_back(rule.data());
        }
        return ret;
    }
}

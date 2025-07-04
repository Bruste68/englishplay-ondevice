if (CMAKE_OSX_ARCHITECTURES STREQUAL "x86_64" OR CMAKE_GENERATOR_PLATFORM_LWR MATCHES "^(x86_64|i686|amd64|x64|win32)$" OR
        (NOT CMAKE_OSX_ARCHITECTURES AND NOT CMAKE_GENERATOR_PLATFORM_LWR AND
         CMAKE_SYSTEM_PROCESSOR MATCHES "^(x86_64|i686|AMD64)$") AND
        CMAKE_COMPILER_IS_GNUCC AND CMAKE_CXX_COMPILER_VERSION VERSION_GREATER 11.0)
    message(STATUS "Using AMX")

    file(GLOB   GGML_HEADERS_AMX "*.h")
    list(APPEND GGML_HEADERS_AMX "../../include/ggml-amx.h")

    file(GLOB   GGML_SOURCES_AMX "*.cpp")

    add_library(ggml-amx
                ${GGML_HEADERS_AMX}
                ${GGML_SOURCES_AMX})

    target_link_libraries(ggml-amx PRIVATE ggml-base)
    target_include_directories(ggml-amx PRIVATE . ..)

    # this is duplicated from the CPU backend, since the AMX backend also depends on the architecture flags
    # TODO: integrate AMX backend into the CPU backend
    if (MSVC)
        # instruction set detection for MSVC only
        if (GGML_NATIVE)
            # TODO: improve, should not reference files from the parent folder
            include(../ggml-cpu/cmake/FindSIMD.cmake)
        endif ()
        if (GGML_AVX512)
            list(APPEND ARCH_FLAGS /arch:AVX512)
            # MSVC has no compile-time flags enabling specific
            # AVX512 extensions, neither it defines the
            # macros corresponding to the extensions.
            # Do it manually.
            if (GGML_AVX512_VBMI)
                add_compile_definitions($<$<COMPILE_LANGUAGE:C>:__AVX512VBMI__>)
                add_compile_definitions($<$<COMPILE_LANGUAGE:CXX>:__AVX512VBMI__>)
            endif()
            if (GGML_AVX512_VNNI)
                add_compile_definitions($<$<COMPILE_LANGUAGE:C>:__AVX512VNNI__>)
                add_compile_definitions($<$<COMPILE_LANGUAGE:CXX>:__AVX512VNNI__>)
            endif()
            if (GGML_AVX512_BF16)
                add_compile_definitions($<$<COMPILE_LANGUAGE:C>:__AVX512BF16__>)
                add_compile_definitions($<$<COMPILE_LANGUAGE:CXX>:__AVX512BF16__>)
            endif()
            if (GGML_AMX_TILE)
                add_compile_definitions($<$<COMPILE_LANGUAGE:C>:__AMX_TILE__>)
                add_compile_definitions($<$<COMPILE_LANGUAGE:CXX>:__AMX_TILE__>)
            endif()
            if (GGML_AMX_INT8)
                add_compile_definitions($<$<COMPILE_LANGUAGE:C>:__AMX_INT8__>)
                add_compile_definitions($<$<COMPILE_LANGUAGE:CXX>:__AMX_INT8__>)
            endif()
            if (GGML_AMX_BF16)
                add_compile_definitions($<$<COMPILE_LANGUAGE:C>:__AMX_BF16__>)
                add_compile_definitions($<$<COMPILE_LANGUAGE:CXX>:__AMX_BF16__>)
            endif()
        elseif (GGML_AVX2)
            list(APPEND ARCH_FLAGS /arch:AVX2)
        elseif (GGML_AVX)
            list(APPEND ARCH_FLAGS /arch:AVX)
        endif()
    else()
        if (GGML_NATIVE)
            list(APPEND ARCH_FLAGS -march=native)
        endif()
        if (GGML_F16C)
            list(APPEND ARCH_FLAGS -mf16c)
        endif()
        if (GGML_FMA)
            list(APPEND ARCH_FLAGS -mfma)
        endif()
        if (GGML_AVX)
            list(APPEND ARCH_FLAGS -mavx)
        endif()
        if (GGML_AVX2)
            list(APPEND ARCH_FLAGS -mavx2)
        endif()
        if (GGML_AVX512)
            list(APPEND ARCH_FLAGS -mavx512f)
            list(APPEND ARCH_FLAGS -mavx512dq)
            list(APPEND ARCH_FLAGS -mavx512bw)
        endif()
        if (GGML_AVX512_VBMI)
            list(APPEND ARCH_FLAGS -mavx512vbmi)
        endif()
        if (GGML_AVX512_VNNI)
            list(APPEND ARCH_FLAGS -mavx512vnni)
        endif()
        if (GGML_AVX512_BF16)
            list(APPEND ARCH_FLAGS -mavx512bf16)
        endif()
        if (GGML_AMX_TILE)
            list(APPEND ARCH_FLAGS -mamx-tile)
        endif()
        if (GGML_AMX_INT8)
            list(APPEND ARCH_FLAGS -mamx-int8)
        endif()
        if (GGML_AMX_BF16)
            list(APPEND ARCH_FLAGS -mamx-bf16)
        endif()
    endif()

    target_compile_options(ggml-amx PRIVATE ${ARCH_FLAGS})
else()
    set(GGML_AMX OFF PARENT_SCOPE)
    message(WARNING "AMX requires x86 and gcc version > 11.0. Turning off GGML_AMX.")
endif()

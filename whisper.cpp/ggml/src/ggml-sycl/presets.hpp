//
// MIT license
// Copyright (C) 2024 Intel Corporation
// SPDX-License-Identifier: MIT
//

//
// Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
// See https://llvm.org/LICENSE.txt for license information.
// SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception
//

#ifndef GGML_SYCL_PRESETS_HPP
#define GGML_SYCL_PRESETS_HPP

#define GGML_SYCL_MAX_STREAMS       8
#define GGML_SYCL_MAX_BUFFERS       256

#define WARP_SIZE GGML_SYCL_WARP_SIZE
#define MATRIX_ROW_PADDING 512 // last row of quant. matrices is a multiple of this to avoid out-of-bounds memory accesses

#define SYCL_GELU_BLOCK_SIZE 256
#define SYCL_SILU_BLOCK_SIZE 256
#define SYCL_TANH_BLOCK_SIZE 256
#define SYCL_RELU_BLOCK_SIZE 256
#define SYCL_HARDSIGMOID_BLOCK_SIZE 256
#define SYCL_HARDSWISH_BLOCK_SIZE 256
#define SYCL_EXP_BLOCK_SIZE 256
#define SYCL_NEG_BLOCK_SIZE 256
#define SYCL_SIGMOID_BLOCK_SIZE 256
#define SYCL_SQRT_BLOCK_SIZE 256
#define SYCL_SIN_BLOCK_SIZE 256
#define SYCL_SQR_BLOCK_SIZE 256
#define SYCL_CPY_BLOCK_SIZE 32
#define SYCL_SCALE_BLOCK_SIZE 256
#define SYCL_CLAMP_BLOCK_SIZE 256
#define SYCL_ROPE_BLOCK_SIZE 256
#define SYCL_ALIBI_BLOCK_SIZE 32
#define SYCL_DIAG_MASK_INF_BLOCK_SIZE 32
#define SYCL_QUANTIZE_BLOCK_SIZE 256
#define SYCL_DEQUANTIZE_BLOCK_SIZE 256
#define SYCL_GET_ROWS_BLOCK_SIZE 256
#define SYCL_UPSCALE_BLOCK_SIZE 256
#define SYCL_CONCAT_BLOCK_SIZE 256
#define SYCL_PAD_BLOCK_SIZE 256
#define SYCL_ACC_BLOCK_SIZE 256
#define SYCL_IM2COL_BLOCK_SIZE 256
#define SYCL_POOL2D_BLOCK_SIZE 256
#define SYCL_ARGMAX_BLOCK_SIZE 256
#define SYCL_CONV_TRANPOSE_1D_BLOCK_SIZE 256
#define SYCL_TIMESTEP_EMBEDDING_BLOCK_SIZE 256

// dmmv = dequantize_mul_mat_vec
#ifndef GGML_SYCL_DMMV_X
#define GGML_SYCL_DMMV_X 32
#endif
#ifndef GGML_SYCL_MMV_Y
#define GGML_SYCL_MMV_Y 1
#endif

#ifndef K_QUANTS_PER_ITERATION
#define K_QUANTS_PER_ITERATION 2
#else
static_assert(K_QUANTS_PER_ITERATION == 1 || K_QUANTS_PER_ITERATION == 2, "K_QUANTS_PER_ITERATION must be 1 or 2");
#endif

#ifndef GGML_SYCL_PEER_MAX_BATCH_SIZE
#define GGML_SYCL_PEER_MAX_BATCH_SIZE 128
#endif // GGML_SYCL_PEER_MAX_BATCH_SIZE

#define MUL_MAT_SRC1_COL_STRIDE 128

#define QK_WARP_SIZE 32
#endif // GGML_SYCL_PRESETS_HPP

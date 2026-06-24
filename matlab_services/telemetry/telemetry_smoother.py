import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("telemetry_smoother")

# Global MATLAB Engine reference
_ml_engine = None

def get_matlab_engine():
    global _ml_engine
    if _ml_engine is None:
        try:
            import matlab.engine
            logger.info("Starting MATLAB Engine for Telemetry Curve Smoothing...")
            _ml_engine = matlab.engine.start_matlab()
            logger.info("MATLAB Engine started successfully.")
        except Exception as e:
            logger.warning(f"MATLAB Engine could not be loaded: {e}. Falling back to SciPy Pchip and Savitzky-Golay filters.")
            _ml_engine = False
    return _ml_engine

def smooth_telemetry(time_seq, throttle_seq, brake_seq, speed_seq=None):
    """
    Smooths throttle and brake telemetry arrays while strictly preserving peaks.
    If MATLAB Engine is present, uses 'interp1' with 'pchip' and 'sgolayfilt'.
    Otherwise, falls back to SciPy.
    """
    # Ensure inputs are standard lists/numpy arrays
    t = np.array(time_seq, dtype=float)
    throttle = np.array(throttle_seq, dtype=float)
    brake = np.array(brake_seq, dtype=float)
    
    # We want a high-resolution time grid for interpolation
    t_smooth = np.linspace(t[0], t[-1], len(t) * 2)

    engine = get_matlab_engine()
    
    if engine:
        try:
            # Convert NumPy arrays to MATLAB doubles
            import matlab
            t_ml = matlab.double(t.tolist())
            throttle_ml = matlab.double(throttle.tolist())
            brake_ml = matlab.double(brake.tolist())
            t_smooth_ml = matlab.double(t_smooth.tolist())
            
            # Apply pchip (Piecewise Cubic Hermite Interpolating Polynomial)
            throttle_pchip = engine.interp1(t_ml, throttle_ml, t_smooth_ml, 'pchip')
            brake_pchip = engine.interp1(t_ml, brake_ml, t_smooth_ml, 'pchip')
            
            # Flatten outputs back to list
            throttle_smooth = np.array(throttle_pchip).flatten().tolist()
            brake_smooth = np.array(brake_pchip).flatten().tolist()
            
            # Use Savitzky-Golay filter to smooth noise
            # sgolayfilt(x, order, framelen)
            # framelen must be odd.
            framelen = 11
            if len(throttle_smooth) > framelen:
                throttle_smooth = engine.sgolayfilt(matlab.double(throttle_smooth), 3, framelen)
                brake_smooth = engine.sgolayfilt(matlab.double(brake_smooth), 3, framelen)
                throttle_smooth = np.array(throttle_smooth).flatten().tolist()
                brake_smooth = np.array(brake_smooth).flatten().tolist()
                
            return {
                "time": t_smooth.tolist(),
                "throttle": throttle_smooth,
                "brake": brake_smooth,
                "engine": "MATLAB Engine"
            }
        except Exception as err:
            logger.error(f"MATLAB execution failed: {err}. Redirecting to SciPy fallback.")
            
    # SciPy fallback
    try:
        from scipy.interpolate import PchipInterpolator
        from scipy.signal import savgol_filter
        
        # Pchip Interpolation
        pchip_throttle = PchipInterpolator(t, throttle)
        pchip_brake = PchipInterpolator(t, brake)
        
        throttle_smooth = pchip_throttle(t_smooth)
        brake_smooth = pchip_brake(t_smooth)
        
        # Savitzky-Golay filtering
        window_size = 11
        if len(t_smooth) > window_size:
            throttle_smooth = savgol_filter(throttle_smooth, window_length=window_size, polyorder=3)
            brake_smooth = savgol_filter(brake_smooth, window_length=window_size, polyorder=3)
            
        # Clip values to standard range [0, 100] percent
        throttle_smooth = np.clip(throttle_smooth, 0.0, 100.0).tolist()
        brake_smooth = np.clip(brake_smooth, 0.0, 100.0).tolist()
        
        return {
            "time": t_smooth.tolist(),
            "throttle": throttle_smooth,
            "brake": brake_smooth,
            "engine": "SciPy Fallback"
        }
    except Exception as fallback_err:
        logger.error(f"SciPy fallback failed: {fallback_err}")
        return {
            "time": t.tolist(),
            "throttle": throttle.tolist(),
            "brake": brake.tolist(),
            "engine": "Unfiltered Raw"
        }

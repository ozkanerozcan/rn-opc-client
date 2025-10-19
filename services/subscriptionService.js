import { supabase } from '../lib/supabase';

/**
 * Subscription Recording Service
 * Supabase ile subscription kayıtlarını yönetir
 * Tablolar: public.subscription_records, public.subscription_values
 */

/**
 * Yeni bir subscription kaydı oluştur veya varolan kaydı döndür
 */
export const createSubscriptionRecord = async (subscriptionId, nodeId, originalNodeId, recordingName = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Önce mevcut kaydı kontrol et (subscription_id unique olduğu için)
    const { data: existingRecords, error: checkError } = await supabase
      .from('subscription_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('subscription_id', subscriptionId)
      .eq('is_recording', false); // Sadece durmuş kayıtları bul

    if (checkError) throw checkError;

    // Eğer durmuş bir kayıt varsa, onu yeniden kullan
    if (existingRecords && existingRecords.length > 0) {
      const existing = existingRecords[0];
      console.log('Found existing stopped recording, reusing:', existing.id);
      return { success: true, data: existing };
    }

    // Yoksa yeni kayıt oluştur (unique constraint olmayacak şekilde)
    const timestamp = Date.now();
    const uniqueSubId = `${subscriptionId}_${timestamp}`;
    const defaultName = recordingName || `Recording ${new Date().toLocaleString()}`;

    const { data, error } = await supabase
      .from('subscription_records')
      .insert([
        {
          user_id: user.id,
          subscription_id: uniqueSubId, // Benzersiz subscription_id
          node_id: nodeId,
          original_node_id: originalNodeId,
          is_recording: false,
          recording_name: defaultName,
        },
      ])
      .select();

    if (error) throw error;
    
    // İlk elemanı döndür
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error('Error creating subscription record:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscription kaydının recording durumunu güncelle (ID ile)
 */
export const updateRecordingStatus = async (recordId, isRecording) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('subscription_records')
      .update({ is_recording: isRecording })
      .eq('user_id', user.id)
      .eq('id', recordId)
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error('Error updating recording status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscription kaydını sil
 */
export const deleteSubscriptionRecord = async (subscriptionId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('subscription_records')
      .delete()
      .eq('user_id', user.id)
      .eq('subscription_id', subscriptionId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting subscription record:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Kullanıcının tüm subscription kayıtlarını getir
 */
export const getSubscriptionRecords = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('subscription_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting subscription records:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Subscription değeri kaydet
 */
export const saveSubscriptionValue = async (subscriptionRecordId, subscriptionId, nodeId, originalNodeId, valueData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('subscription_values')
      .insert([
        {
          user_id: user.id,
          subscription_record_id: subscriptionRecordId,
          subscription_id: subscriptionId,
          node_id: nodeId,
          original_node_id: originalNodeId,
          value: String(valueData.value),
          data_type: valueData.dataType || 'Unknown',
          quality: valueData.quality || 'Good',
          source_timestamp: valueData.sourceTimestamp || new Date().toISOString(),
          server_timestamp: valueData.serverTimestamp || new Date().toISOString(),
          recorded_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving subscription value:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Belirli bir subscription için kaydedilen değerleri getir
 */
export const getSubscriptionValues = async (subscriptionId, limit = 100, offset = 0) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error, count } = await supabase
      .from('subscription_values')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('subscription_id', subscriptionId)
      .order('recorded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { success: true, data: data || [], count };
  } catch (error) {
    console.error('Error getting subscription values:', error);
    return { success: false, error: error.message, data: [], count: 0 };
  }
};

/**
 * Belirli bir node için son kaydedilen değeri getir
 */
export const getLatestValueForNode = async (nodeId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('subscription_values')
      .select('*')
      .eq('user_id', user.id)
      .eq('node_id', nodeId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return { success: true, data: null };
      }
      throw error;
    }
    return { success: true, data };
  } catch (error) {
    console.error('Error getting latest value:', error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Zaman aralığına göre değerleri getir
 */
export const getValuesByTimeRange = async (nodeId, startDate, endDate, limit = 1000) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('subscription_values')
      .select('*')
      .eq('user_id', user.id)
      .eq('node_id', nodeId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('recorded_at', startDate);
    }
    if (endDate) {
      query = query.lte('recorded_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting values by time range:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Belirli bir subscription için kaydedilen değer sayısını getir
 */
export const getRecordedValueCount = async (subscriptionId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { count, error } = await supabase
      .from('subscription_values')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('subscription_id', subscriptionId);

    if (error) throw error;
    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Error getting recorded value count:', error);
    return { success: false, error: error.message, count: 0 };
  }
};

/**
 * Eski kayıtları temizle (30 günden eski)
 */
export const cleanupOldRecords = async (daysToKeep = 30) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('subscription_values')
      .delete()
      .eq('user_id', user.id)
      .lt('recorded_at', cutoffDate.toISOString());

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error cleaning up old records:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Recording istatistiklerini getir (opc.get_recording_statistics fonksiyonunu kullanır)
 */
export const getRecordingStatistics = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .rpc('get_recording_statistics', { p_user_id: user.id });

    if (error) throw error;
    return { success: true, data: data?.[0] || null };
  } catch (error) {
    console.error('Error getting recording statistics:', error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Tüm kayıtları özet bilgileriyle getir (recording_summary view)
 */
export const getRecordingSummary = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('Fetching recording_summary for user:', user.id);

    // Önce view'dan dene
    let { data, error } = await supabase
      .from('recording_summary')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('recording_summary query result:', { data, error });

    // Eğer view bulunamazsa, doğrudan subscription_records tablosundan çek
    if (error && error.message.includes('relation') || error && error.message.includes('does not exist')) {
      console.log('View not found, querying subscription_records directly...');
      
      const { data: recordsData, error: recordsError } = await supabase
        .from('subscription_records')
        .select(`
          id,
          user_id,
          subscription_id,
          node_id,
          original_node_id,
          recording_name,
          is_recording,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (recordsError) throw recordsError;

      // Her kayıt için değer sayısını al
      const enrichedData = await Promise.all(
        (recordsData || []).map(async (record) => {
          const { count } = await supabase
            .from('subscription_values')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_record_id', record.id);

          return {
            ...record,
            total_values: count || 0,
            first_value_at: null,
            last_value_at: null,
            min_value: null,
            max_value: null,
            duration_seconds: null,
          };
        })
      );

      return { success: true, data: enrichedData || [] };
    }

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting recording summary:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Recording ismini güncelle
 */
export const updateRecordingName = async (recordId, newName) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .rpc('update_recording_name', { 
        p_record_id: recordId, 
        p_new_name: newName 
      });

    if (error) throw error;
    return { success: true, updated: data };
  } catch (error) {
    console.error('Error updating recording name:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Kaydı ve tüm değerlerini sil
 */
export const deleteRecording = async (recordId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .rpc('delete_recording', { p_record_id: recordId });

    if (error) throw error;
    return { 
      success: true, 
      deletedValues: data?.[0]?.deleted_values_count || 0 
    };
  } catch (error) {
    console.error('Error deleting recording:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Kaydın değerlerini export et (JSON)
 */
export const exportRecordingValues = async (recordId, limit = 10000) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .rpc('export_recording_values', { 
        p_record_id: recordId,
        p_limit: limit
      });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error exporting recording values:', error);
    return { success: false, error: error.message, data: null };
  }
};

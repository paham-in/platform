//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'upload_temp_upload_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UploadTempUploadErrorResponse {
  /// Returns a new [UploadTempUploadErrorResponse] instance.
  UploadTempUploadErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UploadTempUploadErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory UploadTempUploadErrorResponse.fromJson(Map<String, dynamic> json) => _$UploadTempUploadErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$UploadTempUploadErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}


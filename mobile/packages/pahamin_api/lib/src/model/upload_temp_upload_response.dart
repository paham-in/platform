//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'upload_temp_upload_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UploadTempUploadResponse {
  /// Returns a new [UploadTempUploadResponse] instance.
  UploadTempUploadResponse({

     this.objectName,

     this.url,
  });

  @JsonKey(
    
    name: r'object_name',
    required: false,
    includeIfNull: false,
  )


  final String? objectName;



  @JsonKey(
    
    name: r'url',
    required: false,
    includeIfNull: false,
  )


  final String? url;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UploadTempUploadResponse &&
      other.objectName == objectName &&
      other.url == url;

    @override
    int get hashCode =>
        objectName.hashCode +
        url.hashCode;

  factory UploadTempUploadResponse.fromJson(Map<String, dynamic> json) => _$UploadTempUploadResponseFromJson(json);

  Map<String, dynamic> toJson() => _$UploadTempUploadResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}


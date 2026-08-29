//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'upload_temp_delete_request.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UploadTempDeleteRequest {
  /// Returns a new [UploadTempDeleteRequest] instance.
  UploadTempDeleteRequest({

     this.url,
  });

  @JsonKey(
    
    name: r'url',
    required: false,
    includeIfNull: false,
  )


  final String? url;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UploadTempDeleteRequest &&
      other.url == url;

    @override
    int get hashCode =>
        url.hashCode;

  factory UploadTempDeleteRequest.fromJson(Map<String, dynamic> json) => _$UploadTempDeleteRequestFromJson(json);

  Map<String, dynamic> toJson() => _$UploadTempDeleteRequestToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

